import { Request, Response, NextFunction } from 'express';
import { drugService } from '../services/drugService';
import { DrugType } from '@prisma/client';

export class DrugController {
  /**
   * GET /api/v1/drugs
   * Get all drugs (optionally filter by type)
   */
  async getDrugs(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.query;

      const validTypes: DrugType[] = ['BRAND', 'BIOSIMILAR'];
      const drugType =
        type && validTypes.includes(type as DrugType)
          ? (type as DrugType)
          : undefined;

      const drugs = await drugService.getDrugs(drugType);

      res.json({ drugs });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/drugs/:id
   * Get drug by ID
   */
  async getDrugById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const drug = await drugService.getDrugById(id);

      res.json({ drug });
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
   * GET /api/v1/drugs/:id/biosimilars
   * Get biosimilar alternatives for a brand drug
   */
  async getBiosimilarAlternatives(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await drugService.getBiosimilarAlternatives(id);

      res.json(result);
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
   * POST /api/v1/drugs/seed
   * Seed database with FDA Purple Book drugs
   */
  async seedDrugs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await drugService.seedDrugs();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/drugs/therapeutic-class/:class
   * Get drugs by therapeutic class
   */
  async getDrugsByTherapeuticClass(req: Request, res: Response, next: NextFunction) {
    try {
      const { therapeuticClass } = req.params;
      const drugs = await drugService.getDrugsByTherapeuticClass(therapeuticClass);
      res.json({ drugs, count: drugs.length });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/drugs/interchangeable
   * Get all interchangeable biosimilars (can be substituted at pharmacy level)
   */
  async getInterchangeableBiosimilars(_req: Request, res: Response, next: NextFunction) {
    try {
      const drugs = await drugService.getInterchangeableBiosimilars();
      res.json({
        drugs,
        count: drugs.length,
        description: 'FDA-approved interchangeable biosimilars that can be substituted at the pharmacy without prescriber consultation'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const drugController = new DrugController();
