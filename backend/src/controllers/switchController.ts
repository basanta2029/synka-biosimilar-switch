import { Request, Response, NextFunction } from 'express';
import { switchService } from '../services/switchService';
import { SwitchStatus, AppointmentStatus } from '@prisma/client';

export class SwitchController {
  /**
   * POST /api/v1/switches/eligibility
   * Check patient eligibility for biosimilar switch
   */
  async checkEligibility(req: Request, res: Response, next: NextFunction) {
    try {
      const { patientId, currentDrugId } = req.body;

      if (!patientId || !currentDrugId) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'patientId and currentDrugId are required',
        });
      }

      const eligibility = await switchService.checkEligibility(patientId, currentDrugId);
      res.json(eligibility);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }
      if (error.message.includes('must be a brand')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/switches
   * Create a new switch record
   */
  async createSwitch(req: Request, res: Response, next: NextFunction) {
    try {
      const { patientId, fromDrugId, toDrugId, eligibilityNotes } = req.body;

      if (!patientId || !fromDrugId || !toDrugId) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'patientId, fromDrugId, and toDrugId are required',
        });
      }

      const switchRecord = await switchService.createSwitch({
        patientId,
        fromDrugId,
        toDrugId,
        eligibilityNotes,
      });

      res.status(201).json({ switch: switchRecord });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }
      if (error.message.includes('must be a biosimilar')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/switches/:id/consent
   * Record patient consent
   */
  async recordConsent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { consentText, consentObtained } = req.body;

      if (consentObtained === undefined) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'consentObtained is required',
        });
      }

      if (consentObtained && !consentText) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'consentText is required when consent is obtained',
        });
      }

      const switchRecord = await switchService.recordConsent({
        switchId: id,
        consentText,
        consentObtained,
      });

      res.json({
        switch: switchRecord,
        message: consentObtained
          ? 'Consent recorded successfully. Follow-up appointments have been scheduled.'
          : 'Consent declined recorded.',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }
      if (error.message.includes('pending')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/switches/:id/complete
   * Complete a switch
   */
  async completeSwitch(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const switchRecord = await switchService.completeSwitch(id);

      res.json({
        switch: switchRecord,
        message: 'Switch completed successfully',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }
      if (error.message.includes('consent')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/v1/switches/:id/cancel
   * Cancel a switch
   */
  async cancelSwitch(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const switchRecord = await switchService.cancelSwitch(id, reason);

      res.json({
        switch: switchRecord,
        message: 'Switch cancelled successfully',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }
      if (error.message.includes('completed')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/switches
   * Get all switches with optional filtering
   */
  async getSwitches(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, patientId } = req.query;

      const filters: { status?: SwitchStatus; patientId?: string } = {};

      if (status && ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'].includes(status as string)) {
        filters.status = status as SwitchStatus;
      }

      if (patientId) {
        filters.patientId = patientId as string;
      }

      const switches = await switchService.getSwitches(filters);

      res.json({
        switches,
        count: switches.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/switches/:id
   * Get switch by ID
   */
  async getSwitchById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const switchRecord = await switchService.getSwitchById(id);

      res.json({ switch: switchRecord });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/switches/patient/:patientId
   * Get switches for a patient
   */
  async getPatientSwitches(req: Request, res: Response, next: NextFunction) {
    try {
      const { patientId } = req.params;
      const switches = await switchService.getPatientSwitches(patientId);

      res.json({
        switches,
        count: switches.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/switches/appointments/:appointmentId/followup
   * Record follow-up data
   */
  async recordFollowUp(req: Request, res: Response, next: NextFunction) {
    try {
      const { appointmentId } = req.params;
      const {
        hasSideEffects,
        sideEffectSeverity,
        sideEffectDescription,
        stillTakingMedication,
        patientSatisfaction,
        notes,
      } = req.body;

      if (hasSideEffects === undefined || stillTakingMedication === undefined) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'hasSideEffects and stillTakingMedication are required',
        });
      }

      if (hasSideEffects && !sideEffectSeverity) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'sideEffectSeverity is required when side effects are reported',
        });
      }

      const followUp = await switchService.recordFollowUp(appointmentId, {
        hasSideEffects,
        sideEffectSeverity,
        sideEffectDescription,
        stillTakingMedication,
        patientSatisfaction,
        notes,
      });

      res.json({
        followUp,
        message: 'Follow-up recorded successfully',
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/v1/switches/dashboard/stats
   * Get dashboard statistics
   */
  async getDashboardStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await switchService.getDashboardStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/switches/appointments
   * Get all appointments with optional filtering
   */
  async getAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, patientId, upcoming } = req.query;

      const filters: { status?: AppointmentStatus; patientId?: string; upcoming?: boolean } = {};

      if (status && ['SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED'].includes(status as string)) {
        filters.status = status as AppointmentStatus;
      }

      if (patientId) {
        filters.patientId = patientId as string;
      }

      if (upcoming === 'true') {
        filters.upcoming = true;
      }

      const appointments = await switchService.getAppointments(filters);

      res.json({
        appointments,
        count: appointments.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const switchController = new SwitchController();
