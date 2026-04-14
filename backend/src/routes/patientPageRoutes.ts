import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

/**
 * GET /patient/switch/:token
 * Public (no auth) patient-facing page showing switch details
 */
router.get('/switch/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const switchRecord = await prisma.switchRecord.findUnique({
      where: { patientAccessToken: token },
      include: {
        patient: true,
        fromDrug: true,
        toDrug: true,
        appointments: {
          orderBy: { scheduledAt: 'asc' },
        },
      },
    });

    if (!switchRecord) {
      return res.status(404).send(renderErrorPage('Switch record not found'));
    }

    const patientFirstName = switchRecord.patient.name.split(' ')[0];
    const monthlySavings = switchRecord.fromDrug.costPerMonth - switchRecord.toDrug.costPerMonth;
    const annualSavings = monthlySavings * 12;

    const statusColor: Record<string, string> = {
      PENDING: '#f59e0b',
      COMPLETED: '#10b981',
      FAILED: '#ef4444',
      CANCELLED: '#6b7280',
    };

    const statusLabel: Record<string, string> = {
      PENDING: 'In Progress',
      COMPLETED: 'Completed Successfully',
      FAILED: 'Discontinued',
      CANCELLED: 'Cancelled',
    };

    const appointmentRows = switchRecord.appointments
      .filter((a) => a.appointmentType !== 'INITIAL')
      .map((a) => {
        const typeLabel = a.appointmentType === 'DAY_3' ? 'Day 3 Check-in' : 'Day 14 Follow-up';
        const date = new Date(a.scheduledAt).toLocaleDateString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        const time = new Date(a.scheduledAt).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const isDone = a.status === 'COMPLETED';
        return `
          <div class="appt ${isDone ? 'done' : ''}">
            <div class="appt-icon">${isDone ? '&#10003;' : '&#128197;'}</div>
            <div class="appt-info">
              <strong>${typeLabel}</strong>
              <span>${date} at ${time}</span>
              <span class="appt-status" style="color:${isDone ? '#10b981' : '#3b82f6'}">${isDone ? 'Completed' : 'Upcoming'}</span>
            </div>
          </div>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Medication Switch - Synka</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f0f4f8;color:#1e293b;line-height:1.6}
    .container{max-width:480px;margin:0 auto;padding:16px}
    .header{background:linear-gradient(135deg,#1a6b54,#22967a);color:#fff;border-radius:16px;padding:24px;text-align:center;margin-bottom:16px}
    .header h1{font-size:20px;margin-bottom:4px}
    .header p{opacity:.85;font-size:14px}
    .card{background:#fff;border-radius:12px;padding:20px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
    .card h2{font-size:16px;color:#475569;margin-bottom:12px;display:flex;align-items:center;gap:8px}
    .status-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;color:#fff;background:${statusColor[switchRecord.status] || '#6b7280'}}
    .drug-switch{display:flex;align-items:center;gap:12px;padding:12px;background:#f8fafc;border-radius:10px;margin-bottom:12px}
    .drug{flex:1;text-align:center}
    .drug .name{font-weight:600;font-size:15px}
    .drug .cost{font-size:13px;color:#64748b}
    .arrow{font-size:24px;color:#22967a}
    .savings{text-align:center;padding:12px;background:#ecfdf5;border-radius:10px;margin-top:8px}
    .savings .amount{font-size:22px;font-weight:700;color:#059669}
    .savings .label{font-size:12px;color:#64748b}
    .appt{display:flex;align-items:flex-start;gap:12px;padding:12px;border-radius:10px;background:#f8fafc;margin-bottom:8px}
    .appt.done{background:#f0fdf4}
    .appt-icon{font-size:20px;margin-top:2px}
    .appt-info{display:flex;flex-direction:column;gap:2px;font-size:14px}
    .appt-info strong{font-size:15px}
    .appt-status{font-size:12px;font-weight:600}
    .edu{font-size:14px;color:#475569}
    .edu li{margin-bottom:8px}
    .footer{text-align:center;padding:20px;font-size:12px;color:#94a3b8}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Hi ${patientFirstName}, here&rsquo;s your medication update</h1>
      <p>Synka Biosimilar Switch Program</p>
    </div>

    <div class="card">
      <h2>&#128138; Switch Status <span class="status-badge">${statusLabel[switchRecord.status] || switchRecord.status}</span></h2>
      <div class="drug-switch">
        <div class="drug">
          <div class="name">${switchRecord.fromDrug.name}</div>
          <div class="cost">GHS ${switchRecord.fromDrug.costPerMonth.toFixed(0)}/mo</div>
        </div>
        <div class="arrow">&#10132;</div>
        <div class="drug">
          <div class="name">${switchRecord.toDrug.name}</div>
          <div class="cost">GHS ${switchRecord.toDrug.costPerMonth.toFixed(0)}/mo</div>
        </div>
      </div>
      ${monthlySavings > 0 ? `
      <div class="savings">
        <div class="amount">GHS ${annualSavings.toLocaleString()}</div>
        <div class="label">Projected Annual Savings (GHS ${monthlySavings.toLocaleString()}/month)</div>
      </div>` : ''}
    </div>

    ${appointmentRows ? `
    <div class="card">
      <h2>&#128197; Your Follow-up Appointments</h2>
      ${appointmentRows}
    </div>` : ''}

    <div class="card">
      <h2>&#128218; About Your New Medication</h2>
      <ul class="edu">
        <li><strong>What is a biosimilar?</strong> A biosimilar is a medication that is highly similar to a brand-name biologic. It has been rigorously tested and approved by regulatory authorities to work the same way in your body.</li>
        <li><strong>Is it safe?</strong> Yes. Biosimilars go through extensive clinical trials. They have the same safety profile, strength, and dosage form as the original medication.</li>
        <li><strong>Why the switch?</strong> Biosimilars can save you up to 77% on medication costs while providing the same therapeutic benefits.</li>
        <li><strong>What to watch for:</strong> As with any medication change, pay attention to how you feel. If you experience unusual side effects, contact your healthcare provider right away.</li>
      </ul>
    </div>

    <div class="footer">
      <p>Provided by your pharmacist through the Synka Biosimilar Switch Program</p>
      <p>Switch date: ${new Date(switchRecord.switchDate).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    console.error('Patient page error:', error);
    return res.status(500).send(renderErrorPage('Something went wrong'));
  }
});

function renderErrorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Synka</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f4f8;color:#475569}
    .msg{text-align:center;padding:40px}
    .msg h1{font-size:48px;margin-bottom:8px}
    .msg p{font-size:18px}
  </style>
</head>
<body><div class="msg"><h1>&#128148;</h1><p>${message}</p></div></body>
</html>`;
}

export default router;
