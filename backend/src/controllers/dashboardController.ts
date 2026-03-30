import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

export class DashboardController {
  /**
   * GET /api/v1/dashboard/metrics
   * Core program metrics for admins
   */
  async getMetrics(_req: Request, res: Response, next: NextFunction) {
    try {
      const now = new Date();
      const daysAgo30 = new Date(now);
      daysAgo30.setDate(now.getDate() - 30);

      const [
        switchCounts,
        followUps,
        severeAlertsLast30,
        switchesWithSavings,
      ] = await Promise.all([
        prisma.switchRecord.groupBy({
          by: ['status'],
          _count: { _all: true },
        }),
        prisma.followUp.findMany({
          include: {
            appointment: true,
          },
        }),
        prisma.alert.count({
          where: {
            severity: 'SEVERE',
            createdAt: {
              gte: daysAgo30,
            },
          },
        }),
        prisma.switchRecord.findMany({
          where: {
            status: 'COMPLETED',
          },
          include: {
            fromDrug: true,
            toDrug: true,
          },
        }),
      ]);

      const statusCounts: Record<string, number> = {
        PENDING: 0,
        COMPLETED: 0,
        FAILED: 0,
        CANCELLED: 0,
      };

      for (const row of switchCounts) {
        statusCounts[row.status] = row._count._all;
      }

      const day3Appointments = followUps.filter(
        f => f.appointment.appointmentType === 'DAY_3'
      );
      const day14Appointments = followUps.filter(
        f => f.appointment.appointmentType === 'DAY_14'
      );

      const day3CompletionRate =
        day3Appointments.length > 0
          ? Math.round(
              (day3Appointments.filter(
                f => f.appointment.status === 'COMPLETED'
              ).length /
                day3Appointments.length) *
                100
            )
          : 0;

      const day14CompletionRate =
        day14Appointments.length > 0
          ? Math.round(
              (day14Appointments.filter(
                f => f.appointment.status === 'COMPLETED'
              ).length /
                day14Appointments.length) *
                100
            )
          : 0;

      const totalSavings = switchesWithSavings.reduce((sum, s) => {
        return sum + (s.fromDrug.costPerMonth - s.toDrug.costPerMonth) * 12;
      }, 0);

      const uniquePatients = new Set(switchesWithSavings.map(s => s.patientId));
      const averageSavingsPerPatient =
        uniquePatients.size > 0 ? totalSavings / uniquePatients.size : 0;

      res.json({
        switchesByStatus: statusCounts,
        followUpCompletion: {
          day3: day3CompletionRate,
          day14: day14CompletionRate,
        },
        totalCostSavings: totalSavings,
        averageSavingsPerPatient,
        severeAlertsLast30Days: severeAlertsLast30,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/recent-switches
   */
  async getRecentSwitches(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt((req.query.limit as string) || '20', 10);

      const switches = await prisma.switchRecord.findMany({
        include: {
          patient: true,
          fromDrug: true,
          toDrug: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      res.json({
        switches,
        count: switches.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dashboard/alerts
   */
  async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const { severity, from, to } = req.query;

      const where: any = {};

      if (severity) {
        where.severity = severity;
      }

      if (from || to) {
        where.createdAt = {};
        if (from) {
          where.createdAt.gte = new Date(from as string);
        }
        if (to) {
          where.createdAt.lte = new Date(to as string);
        }
      }

      const alerts = await prisma.alert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        alerts,
        count: alerts.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();

