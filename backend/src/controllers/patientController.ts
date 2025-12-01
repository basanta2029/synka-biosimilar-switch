import { Request, Response, NextFunction } from 'express';
import { patientService } from '../services/patientService';

export class PatientController {
  /**
   * GET /api/v1/patients
   * Get all patients with optional search
   */
  async getPatients(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, limit = '20', offset = '0' } = req.query;

      const result = await patientService.getPatients(
        search as string | undefined,
        parseInt(limit as string, 10),
        parseInt(offset as string, 10)
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/patients/:id
   * Get patient by ID with related data
   */
  async getPatientById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const patient = await patientService.getPatientById(id);

      res.json({ patient });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/patients
   * Create new patient
   */
  async createPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, phone, dateOfBirth, language, allergies } = req.body;

      // Validation
      if (!name || !phone || !dateOfBirth || !language) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'name, phone, dateOfBirth, and language are required',
        });
      }

      const patient = await patientService.createPatient({
        name,
        phone,
        dateOfBirth: new Date(dateOfBirth),
        language,
        allergies,
      });

      res.status(201).json({ patient });
    } catch (error: any) {
      if (error.message.includes('already exists') || error.message.includes('at least 18')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * PUT /api/v1/patients/:id
   * Update patient
   */
  async updatePatient(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, phone, dateOfBirth, language, allergies } = req.body;

      const data: any = {};
      if (name) data.name = name;
      if (phone) data.phone = phone;
      if (dateOfBirth) data.dateOfBirth = new Date(dateOfBirth);
      if (language) data.language = language;
      if (allergies !== undefined) data.allergies = allergies;

      const patient = await patientService.updatePatient(id, data);

      res.json({ patient });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }
      if (error.message.includes('already exists') || error.message.includes('at least 18')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/v1/patients/:id
   * Delete patient
   */
  async deletePatient(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await patientService.deletePatient(id);

      res.json(result);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Not Found',
          message: error.message,
        });
      }
      if (error.message.includes('Cannot delete')) {
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message,
        });
      }
      next(error);
    }
  }
}

export const patientController = new PatientController();
