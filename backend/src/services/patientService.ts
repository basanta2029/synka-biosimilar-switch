import { PrismaClient, Patient } from '@prisma/client';
import { prisma } from '../utils/prisma';

export class PatientService {
  /**
   * Get all patients with optional search
   */
  async getPatients(searchQuery?: string, limit: number = 20, offset: number = 0) {
    const where = searchQuery
      ? {
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' as const } },
            { phone: { contains: searchQuery } },
          ],
        }
      : {};

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.patient.count({ where }),
    ]);

    return {
      patients,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  }

  /**
   * Get patient by ID with related data
   */
  async getPatientById(id: string) {
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        switches: {
          include: {
            fromDrug: true,
            toDrug: true,
            appointments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        appointments: {
          where: {
            scheduledAt: {
              gte: new Date(),
            },
          },
          orderBy: { scheduledAt: 'asc' },
          take: 5,
        },
      },
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    return patient;
  }

  /**
   * Create new patient
   */
  async createPatient(data: {
    id?: string; // Optional ID from mobile client (offline-first)
    name: string;
    phone: string;
    dateOfBirth: Date;
    language: 'EN' | 'ES';
    allergies?: string;
  }) {
    // Check if phone already exists
    const existing = await prisma.patient.findUnique({
      where: { phone: data.phone },
    });

    if (existing) {
      throw new Error('A patient with this phone number already exists');
    }

    // Validate age >= 18
    const age = new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear();
    if (age < 18) {
      throw new Error('Patient must be at least 18 years old');
    }

    const patient = await prisma.patient.create({
      data,
    });

    return patient;
  }

  /**
   * Update patient
   */
  async updatePatient(
    id: string,
    data: {
      name?: string;
      phone?: string;
      dateOfBirth?: Date;
      language?: 'EN' | 'ES';
      allergies?: string;
    }
  ) {
    // Check if patient exists
    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Patient not found');
    }

    // If phone is being updated, check for duplicates
    if (data.phone && data.phone !== existing.phone) {
      const duplicate = await prisma.patient.findUnique({
        where: { phone: data.phone },
      });
      if (duplicate) {
        throw new Error('A patient with this phone number already exists');
      }
    }

    // If DOB is being updated, validate age
    if (data.dateOfBirth) {
      const age = new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear();
      if (age < 18) {
        throw new Error('Patient must be at least 18 years old');
      }
    }

    const patient = await prisma.patient.update({
      where: { id },
      data,
    });

    return patient;
  }

  /**
   * Delete patient
   */
  async deletePatient(id: string) {
    // Check if patient exists
    const existing = await prisma.patient.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Patient not found');
    }

    // Check if patient has any switches
    const switches = await prisma.switchRecord.count({
      where: { patientId: id },
    });

    if (switches > 0) {
      throw new Error(
        'Cannot delete patient with existing switch records. Please cancel or complete all switches first.'
      );
    }

    await prisma.patient.delete({ where: { id } });

    return { success: true };
  }
}

export const patientService = new PatientService();
