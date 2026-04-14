/**
 * Background scheduler that processes queued SMS messages.
 *
 * Runs on a fixed interval and picks up any SmsLog entries whose
 * `scheduledFor` time has arrived and `deliveryStatus` is still PENDING.
 */

import { prisma } from '../utils/prisma';
import { smsService } from './smsService';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

let intervalHandle: NodeJS.Timeout | null = null;

async function processScheduledSms(): Promise<void> {
  try {
    const now = new Date();

    // Find all SMS that are due to be sent
    const pendingSms = await prisma.smsLog.findMany({
      where: {
        deliveryStatus: 'PENDING',
        scheduledFor: { lte: now },
      },
      take: 20, // batch limit
      orderBy: { scheduledFor: 'asc' },
      include: { patient: true },
    });

    if (pendingSms.length === 0) return;

    console.log(`[SMS Scheduler] Processing ${pendingSms.length} scheduled message(s)...`);

    for (const sms of pendingSms) {
      try {
        // Re-send through the service (which handles Twilio + status updates)
        await smsService.sendSmsNow({
          patientId: sms.patientId,
          appointmentId: sms.appointmentId ?? undefined,
          to: sms.phoneNumber,
          body: sms.message,
          language: sms.patient?.language ?? 'EN',
        });

        // Mark the original scheduled entry as SENT (the sendSmsNow creates a new log,
        // but we also update the scheduled one so it doesn't get re-processed)
        await prisma.smsLog.update({
          where: { id: sms.id },
          data: { deliveryStatus: 'SENT', sentAt: now },
        });
      } catch (err: any) {
        console.error(`[SMS Scheduler] Failed to send SMS ${sms.id}:`, err?.message);
        await prisma.smsLog.update({
          where: { id: sms.id },
          data: {
            deliveryStatus: 'FAILED',
            errorMessage: err?.message ?? 'Scheduler send failed',
          },
        });
      }
    }
  } catch (err) {
    console.error('[SMS Scheduler] Error in processing loop:', err);
  }
}

export function startSmsScheduler(): void {
  if (intervalHandle) return; // already running
  console.log(`[SMS Scheduler] Started — polling every ${POLL_INTERVAL_MS / 1000}s`);
  // Run once immediately, then on interval
  processScheduledSms();
  intervalHandle = setInterval(processScheduledSms, POLL_INTERVAL_MS);
}

export function stopSmsScheduler(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('[SMS Scheduler] Stopped');
  }
}
