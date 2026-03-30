import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All dashboard routes require admin access
router.use(authenticate, authorize('ADMIN'));

router.get('/metrics', (req, res, next) =>
  dashboardController.getMetrics(req, res, next)
);

router.get('/recent-switches', (req, res, next) =>
  dashboardController.getRecentSwitches(req, res, next)
);

router.get('/alerts', (req, res, next) =>
  dashboardController.getAlerts(req, res, next)
);

export default router;

