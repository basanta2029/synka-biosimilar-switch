import { Router } from 'express';
import { switchController } from '../controllers/switchController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All switch routes require authentication
router.use(authenticate);

// Dashboard statistics (must be before :id routes)
router.get('/dashboard/stats', (req, res, next) =>
  switchController.getDashboardStats(req, res, next)
);

// Get all appointments (must be before :id routes)
router.get('/appointments', (req, res, next) =>
  switchController.getAppointments(req, res, next)
);

// Eligibility check
router.post('/eligibility', (req, res, next) =>
  switchController.checkEligibility(req, res, next)
);

// Get patient switches (must be before :id routes)
router.get('/patient/:patientId', (req, res, next) =>
  switchController.getPatientSwitches(req, res, next)
);

// Follow-up recording (must be before :id routes)
router.post('/appointments/:appointmentId/followup', (req, res, next) =>
  switchController.recordFollowUp(req, res, next)
);

// Get all switches
router.get('/', (req, res, next) =>
  switchController.getSwitches(req, res, next)
);

// Create new switch
router.post('/', (req, res, next) =>
  switchController.createSwitch(req, res, next)
);

// Get switch by ID
router.get('/:id', (req, res, next) =>
  switchController.getSwitchById(req, res, next)
);

// Record consent
router.post('/:id/consent', (req, res, next) =>
  switchController.recordConsent(req, res, next)
);

// Complete switch
router.post('/:id/complete', (req, res, next) =>
  switchController.completeSwitch(req, res, next)
);

// Cancel switch
router.post('/:id/cancel', (req, res, next) =>
  switchController.cancelSwitch(req, res, next)
);

export default router;
