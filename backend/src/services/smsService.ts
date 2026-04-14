import twilioFactory from 'twilio';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { Language, SmsStatus } from '@prisma/client';

const twilio =
  config.twilio.accountSid && config.twilio.authToken
    ? twilioFactory(config.twilio.accountSid, config.twilio.authToken)
    : null;

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (raw.startsWith('+')) return raw;
  if (digits.length === 10) return `${config.defaultCountryCode}${digits}`;
  return `+${digits}`;
}

function isTwilioReady(): boolean {
  if (!twilio) return false;
  if (config.twilio.useWhatsApp) return !!config.twilio.whatsAppNumber;
  return !!config.twilio.phoneNumber;
}

interface ScheduleSmsInput {
  patientId: string;
  appointmentId?: string;
  to: string;
  body: string;
  language: Language;
  templateId?: string;
  scheduledFor?: string;
}

interface SendSmsNowInput extends Omit<ScheduleSmsInput, 'scheduledFor'> {}

export class SmsService {
  async scheduleSms(input: ScheduleSmsInput) {
    const scheduledFor =
      input.scheduledFor != null ? new Date(input.scheduledFor) : undefined;

    const sms = await prisma.smsLog.create({
      data: {
        patientId: input.patientId,
        appointmentId: input.appointmentId,
        phoneNumber: input.to,
        message: input.body,
        language: input.language,
        templateId: input.templateId,
        scheduledFor,
        deliveryStatus: 'PENDING',
      },
    });

    return sms;
  }

  async sendSmsNow(input: SendSmsNowInput) {
    const normalizedTo = normalizePhone(input.to);

    const sms = await prisma.smsLog.create({
      data: {
        patientId: input.patientId,
        appointmentId: input.appointmentId,
        phoneNumber: normalizedTo,
        message: input.body,
        language: input.language,
        templateId: input.templateId,
        sentAt: new Date(),
        deliveryStatus: 'PENDING',
      },
    });

    if (!isTwilioReady()) {
      await prisma.smsLog.update({
        where: { id: sms.id },
        data: {
          deliveryStatus: 'FAILED',
          errorMessage: 'Twilio is not configured',
        },
      });

      return sms;
    }

    try {
      const to = config.twilio.useWhatsApp
        ? `whatsapp:${normalizedTo}`
        : normalizedTo;
      const from = config.twilio.useWhatsApp
        ? `whatsapp:${config.twilio.whatsAppNumber}`
        : config.twilio.phoneNumber!;

      const result = await twilio!.messages.create({
        to,
        from,
        body: input.body,
        statusCallback: undefined,
      });

      const updated = await prisma.smsLog.update({
        where: { id: sms.id },
        data: {
          twilioSid: result.sid,
          deliveryStatus: 'SENT',
        },
      });

      return updated;
    } catch (error: any) {
      const updated = await prisma.smsLog.update({
        where: { id: sms.id },
        data: {
          deliveryStatus: 'FAILED',
          errorMessage: error?.message ?? 'Failed to send SMS',
        },
      });

      return updated;
    }
  }

  /**
   * Handle Twilio webhook callbacks to update delivery status.
   * Supports basic two-way SMS codes per PRD.
   */
  async handleTwilioWebhook(payload: any): Promise<string | undefined> {
    const messageSid: string | undefined = payload.MessageSid || payload.SmsSid;
    const messageStatus: string | undefined = payload.MessageStatus || payload.SmsStatus;
    const to: string | undefined = payload.To;
    const from: string | undefined = payload.From;
    const body: string | undefined = payload.Body;

    if (!messageSid) {
      return;
    }

    // Map Twilio status to SmsStatus enum
    let deliveryStatus: SmsStatus | undefined;
    if (messageStatus) {
      const normalized = messageStatus.toLowerCase();
      if (normalized === 'delivered' || normalized === 'received') {
        deliveryStatus = 'DELIVERED';
      } else if (normalized === 'failed' || normalized === 'undelivered') {
        deliveryStatus = 'FAILED';
      } else if (normalized === 'sent') {
        deliveryStatus = 'SENT';
      }
    }

    await prisma.smsLog.updateMany({
      where: {
        twilioSid: messageSid,
      },
      data: {
        deliveryStatus: deliveryStatus ?? undefined,
        sentAt: deliveryStatus === 'SENT' ? new Date() : undefined,
      },
    });

    // Handle simple two-way codes if this is an inbound message
    if (body && from) {
      const trimmed = (body as string).trim().toUpperCase();
      const cleanFrom = from.replace(/^whatsapp:/, '');

      const sms = await prisma.smsLog.findFirst({
        where: {
          phoneNumber: cleanFrom,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          appointment: true,
        },
      });

      if (!sms || !sms.appointmentId) {
        return 'Sorry, we could not find a matching appointment. Please contact the clinic directly.';
      }

      if (trimmed === '1') {
        await prisma.appointment.update({
          where: { id: sms.appointmentId },
          data: {
            status: 'SCHEDULED',
          },
        });
        return 'Your appointment has been confirmed. We look forward to seeing you!';
      } else if (trimmed === '2') {
        await prisma.appointment.update({
          where: { id: sms.appointmentId },
          data: {
            status: 'RESCHEDULED',
            notes: 'Patient replied with 2 (reschedule requested)',
          },
        });
        return 'Your reschedule request has been received. The clinic will contact you with a new date.';
      } else if (trimmed === 'HELP') {
        if (sms.patientId) {
          await prisma.alert.create({
            data: {
              type: 'SMS_HELP',
              patientId: sms.patientId,
              description: 'Patient replied HELP to SMS',
              severity: 'MODERATE',
            },
          });
        }
        return 'Your help request has been received. A clinic staff member will reach out to you shortly.';
      }

      return 'Reply 1 to confirm your appointment, 2 to reschedule, or HELP for assistance.';
    }
  }
}

export const smsService = new SmsService();

