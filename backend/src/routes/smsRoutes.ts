import { Router } from 'express';
import { smsController } from '../controllers/smsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All SMS routes require authentication; scheduling/sending restricted to clinical staff
router.use(authenticate);

// Nurses (STAFF), doctors, and admins can schedule/send SMS
router.post(
  '/schedule',
  authorize('STAFF', 'DOCTOR', 'ADMIN'),
  (req, res, next) => smsController.schedule(req, res, next)
);

router.post(
  '/send',
  authorize('STAFF', 'DOCTOR', 'ADMIN'),
  (req, res, next) => smsController.sendNow(req as any, res, next)
);

// Twilio webhook does not use JWT auth (Twilio cannot send JWT)
router.post('/webhook', (req, res, next) => smsController.webhook(req, res, next));

export default router;

