import twilioFactory from 'twilio';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { Language, SmsStatus } from '@prisma/client';

const twilio =
  config.twilio.accountSid && config.twilio.authToken
    ? twilioFactory(config.twilio.accountSid, config.twilio.authToken)
    : null;

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
    // First create log entry
    const sms = await prisma.smsLog.create({
      data: {
        patientId: input.patientId,
        appointmentId: input.appointmentId,
        phoneNumber: input.to,
        message: input.body,
        language: input.language,
        templateId: input.templateId,
        sentAt: new Date(),
        deliveryStatus: 'PENDING',
      },
    });

    if (!twilio || !config.twilio.phoneNumber) {
      // If Twilio is not configured, mark as failed but keep log
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
      const result = await twilio.messages.create({
        to: input.to,
        from: config.twilio.phoneNumber!,
        body: input.body,
        statusCallback: undefined, // Use global webhook URL configured in Twilio console
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
  async handleTwilioWebhook(payload: any) {
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

      const sms = await prisma.smsLog.findFirst({
        where: {
          phoneNumber: from,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          appointment: true,
        },
      });

      if (!sms || !sms.appointmentId) {
        return;
      }

      if (trimmed === '1') {
        // Confirm appointment
        await prisma.appointment.update({
          where: { id: sms.appointmentId },
          data: {
            status: 'SCHEDULED',
          },
        });
      } else if (trimmed === '2') {
        // Request reschedule
        await prisma.appointment.update({
          where: { id: sms.appointmentId },
          data: {
            status: 'RESCHEDULED',
            notes: 'Patient replied with 2 (reschedule requested)',
          },
        });
      } else if (trimmed === 'HELP') {
        // Create alert for help request
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
      }
    }
  }
}

export const smsService = new SmsService();

