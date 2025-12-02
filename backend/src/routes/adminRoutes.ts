import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// POST /api/v1/admin/reset-data - Clear all patient data (keeps users and drugs)
router.post('/reset-data', async (req: Request, res: Response) => {
  try {
    // Delete in order to respect foreign key constraints
    // 1. Delete alerts
    await prisma.alert.deleteMany({});

    // 2. Delete SMS logs
    await prisma.smsLog.deleteMany({});

    // 3. Delete follow-ups
    await prisma.followUp.deleteMany({});

    // 4. Delete appointments
    await prisma.appointment.deleteMany({});

    // 5. Delete switch records
    await prisma.switchRecord.deleteMany({});

    // 6. Delete patients
    await prisma.patient.deleteMany({});

    res.json({
      success: true,
      message: 'All patient data has been cleared successfully',
      deleted: {
        patients: true,
        switches: true,
        appointments: true,
        followUps: true,
        smsLogs: true,
        alerts: true,
      },
    });
  } catch (error) {
    console.error('Error resetting data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/v1/admin/stats - Get database statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [patients, switches, appointments, followUps, drugs, users] = await Promise.all([
      prisma.patient.count(),
      prisma.switchRecord.count(),
      prisma.appointment.count(),
      prisma.followUp.count(),
      prisma.drug.count(),
      prisma.user.count(),
    ]);

    res.json({
      patients,
      switches,
      appointments,
      followUps,
      drugs,
      users,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
