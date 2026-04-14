import { Router } from 'express';
import { smsController } from '../controllers/smsController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Twilio webhook — must be BEFORE authenticate middleware (Twilio cannot send JWT)
router.post('/webhook', (req, res, next) => smsController.webhook(req, res, next));

// All remaining SMS routes require authentication
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

export default router;

