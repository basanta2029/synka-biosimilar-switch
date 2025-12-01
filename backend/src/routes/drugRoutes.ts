import { Router } from 'express';
import { drugController } from '../controllers/drugController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All drug routes require authentication
router.use(authenticate);

// POST /api/v1/drugs/seed - Seed FDA Purple Book drugs (development only)
router.post('/seed', (req, res, next) => drugController.seedDrugs(req, res, next));

// GET /api/v1/drugs/interchangeable - Get all FDA-approved interchangeable biosimilars
router.get('/interchangeable', (req, res, next) =>
  drugController.getInterchangeableBiosimilars(req, res, next)
);

// GET /api/v1/drugs/therapeutic-class/:therapeuticClass - Get drugs by therapeutic class
router.get('/therapeutic-class/:therapeuticClass', (req, res, next) =>
  drugController.getDrugsByTherapeuticClass(req, res, next)
);

// GET /api/v1/drugs - Get all drugs (with optional type filter)
router.get('/', (req, res, next) => drugController.getDrugs(req, res, next));

// GET /api/v1/drugs/:id - Get drug by ID
router.get('/:id', (req, res, next) => drugController.getDrugById(req, res, next));

// GET /api/v1/drugs/:id/biosimilars - Get biosimilar alternatives for a brand drug
router.get('/:id/biosimilars', (req, res, next) =>
  drugController.getBiosimilarAlternatives(req, res, next)
);

export default router;
