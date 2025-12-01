import { Router } from 'express';
import { patientController } from '../controllers/patientController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All patient routes require authentication
router.use(authenticate);

// GET /api/v1/patients - Get all patients (with optional search)
router.get('/', (req, res, next) => patientController.getPatients(req, res, next));

// GET /api/v1/patients/:id - Get patient by ID
router.get('/:id', (req, res, next) => patientController.getPatientById(req, res, next));

// POST /api/v1/patients - Create new patient
router.post('/', (req, res, next) => patientController.createPatient(req, res, next));

// PUT /api/v1/patients/:id - Update patient
router.put('/:id', (req, res, next) => patientController.updatePatient(req, res, next));

// DELETE /api/v1/patients/:id - Delete patient
router.delete('/:id', (req, res, next) => patientController.deletePatient(req, res, next));

export default router;
