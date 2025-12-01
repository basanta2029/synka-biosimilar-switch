import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface RegisterUserDTO {
  email: string;
  password: string;
  name: string;
  role?: 'ADMIN' | 'DOCTOR' | 'STAFF';
}

export interface LoginUserDTO {
  email: string;
  password: string;
}

export interface CreatePatientDTO {
  name: string;
  phone: string;
  dateOfBirth: string;
  language?: 'EN' | 'ES';
  allergies?: string;
}

export interface CreateSwitchDTO {
  patientId: string;
  fromDrugId: string;
  toDrugId: string;
  switchDate: string;
  eligibilityNotes?: string;
  consentObtained: boolean;
  consentTimestamp?: string;
  appointments: Array<{
    appointmentType: 'INITIAL' | 'DAY_3' | 'DAY_14';
    scheduledAt: string;
  }>;
}

export interface CreateFollowUpDTO {
  appointmentId: string;
  hasSideEffects: boolean;
  sideEffectSeverity?: 'MILD' | 'MODERATE' | 'SEVERE';
  sideEffectDescription?: string;
  stillTakingMedication: boolean;
  patientSatisfaction?: number;
  notes?: string;
}

export interface SyncEntityDTO {
  type: 'patient' | 'switch' | 'appointment' | 'followUp';
  id: string;
  action: 'create' | 'update' | 'delete';
  data: any;
}
