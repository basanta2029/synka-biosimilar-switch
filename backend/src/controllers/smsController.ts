import { Request, Response, NextFunction } from 'express';
import { smsService } from '../services/smsService';
import { AuthRequest } from '../types';
import { logAudit } from '../services/auditService';

export class SmsController {
  /**
   * POST /api/v1/sms/schedule
   * Schedule an SMS to be sent (typically tied to an appointment or switch)
   */
  async schedule(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { patientId, appointmentId, to, body, language, templateId, scheduledFor } =
        req.body;

      if (!patientId || !to || !body || !language) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'patientId, to, body, and language are required',
        });
      }

      const sms = await smsService.scheduleSms({
        patientId,
        appointmentId,
        to,
        body,
        language,
        templateId,
        scheduledFor,
      });

      await logAudit({
        req,
        action: 'SMS_SCHEDULED',
        entityType: 'SmsLog',
        entityId: sms.id,
        metadata: { patientId, appointmentId, templateId },
      });

      res.status(201).json({ sms });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/sms/send
   * Send an SMS immediately (manual send)
   */
  async sendNow(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { patientId, appointmentId, to, body, language, templateId } = req.body;

      if (!patientId || !to || !body || !language) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'patientId, to, body, and language are required',
        });
      }

      const sms = await smsService.sendSmsNow({
        patientId,
        appointmentId,
        to,
        body,
        language,
        templateId,
      });

      await logAudit({
        req,
        action: 'SMS_SENT',
        entityType: 'SmsLog',
        entityId: sms.id,
        metadata: { patientId, appointmentId, templateId },
      });

      res.status(201).json({ sms });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/sms/webhook
   * Twilio status callback webhook
   */
  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      await smsService.handleTwilioWebhook(req.body);
      // Twilio expects a 200 with empty body
      res.status(200).end();
    } catch (error) {
      next(error);
    }
  }
}

export const smsController = new SmsController();

