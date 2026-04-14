/**
 * Bilingual SMS templates for Synka biosimilar switch workflow (EN / Twi).
 *
 * Ghana mobile networks typically truncate at 160 chars for plain SMS,
 * so every template stays under that limit.
 */

interface SwitchInitiatedParams {
  patientName: string;
  fromDrug: string;
  toDrug: string;
  day3Date: string; // formatted date string
}

interface AppointmentReminderParams {
  patientName: string;
  appointmentType: 'DAY_3' | 'DAY_14';
  date: string; // formatted date string
}

interface SwitchCompletedParams {
  patientName: string;
  toDrug: string;
}

// ---------------------------------------------------------------------------
// 1. Switch initiated (sent right after consent)
// ---------------------------------------------------------------------------
export function switchInitiatedMessage(
  lang: 'EN' | 'TW',
  params: SwitchInitiatedParams
): string {
  if (lang === 'TW') {
    return (
      `Synka: ${params.patientName}, wo aduro sesae fi ${params.fromDrug} ko ${params.toDrug}. ` +
      `Wo check-up a edi kan ye ${params.day3Date}. ` +
      `Kyere 1=confirm, 2=sesa bere, HELP=mmoa.`
    );
  }
  return (
    `Synka Health: ${params.patientName}, your medication switch from ${params.fromDrug} to ${params.toDrug} is confirmed. ` +
    `First follow-up: ${params.day3Date}. Reply 1=confirm, 2=reschedule, HELP.`
  );
}

// ---------------------------------------------------------------------------
// 2. Appointment reminder (sent 24h before follow-up)
// ---------------------------------------------------------------------------
export function appointmentReminderMessage(
  lang: 'EN' | 'TW',
  params: AppointmentReminderParams
): string {
  const visitLabel =
    params.appointmentType === 'DAY_3' ? 'Day 3' : 'Day 14';

  if (lang === 'TW') {
    return (
      `Synka: ${params.patientName}, wo ${visitLabel} check-up ye ky3na ${params.date}. ` +
      `Yew bra clinic no mu. Kyere 1=confirm, 2=sesa bere.`
    );
  }
  return (
    `Synka Reminder: ${params.patientName}, your ${visitLabel} follow-up is tomorrow (${params.date}). ` +
    `Please visit the clinic. Reply 1=confirm, 2=reschedule.`
  );
}

// ---------------------------------------------------------------------------
// 3. Switch completed successfully
// ---------------------------------------------------------------------------
export function switchCompletedMessage(
  lang: 'EN' | 'TW',
  params: SwitchCompletedParams
): string {
  if (lang === 'TW') {
    return (
      `Synka: ${params.patientName}, wo aduro sesae ko ${params.toDrug} awie yie! ` +
      `Fa wo ho to hene so na se wo nya ohaw biara a, fr3 clinic no.`
    );
  }
  return (
    `Synka Health: ${params.patientName}, your biosimilar switch to ${params.toDrug} is complete. ` +
    `Continue your medication as prescribed. Contact the clinic if you have concerns.`
  );
}
