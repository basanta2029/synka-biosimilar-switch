// User & Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'DOCTOR' | 'STAFF';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: 'ADMIN' | 'DOCTOR' | 'STAFF';
}

// Patient Types
export interface Patient {
  id: string;
  name: string;
  phone: string;
  dateOfBirth: string;
  language: 'EN' | 'ES';
  diagnosis?: string;      // Primary diagnosis code (e.g., "RHEUMATOID_ARTHRITIS")
  allergies?: string;      // Comma-separated allergy codes (e.g., "ADALIMUMAB,LATEX")
  createdAt: string;
  updatedAt: string;
  synced?: boolean;
}

export interface PatientFormData {
  name: string;
  phone: string;
  dateOfBirth: Date;
  language: 'EN' | 'ES';
  diagnosis?: string;      // Primary diagnosis code
  allergies?: string[];    // Array of allergy codes
}

// Drug Types
export interface Drug {
  id: string;
  name: string;
  type: 'BRAND' | 'BIOSIMILAR';
  costPerMonth: number;
  approvedForSwitch: boolean;
  therapeuticClass: string;
  manufacturer?: string;
  description?: string;
  createdAt: string;
  // FDA Purple Book Fields
  activeIngredient?: string;
  fdaSuffix?: string;
  blaNumber?: string;
  fdaApprovalDate?: string;
  interchangeability: 'NOT_APPLICABLE' | 'BIOSIMILAR' | 'INTERCHANGEABLE';
  referenceProductId?: string;
  referenceProduct?: Drug;
  biosimilars?: Drug[];
  indications?: string;
  administrationRoute?: string;
}

// Biosimilar with savings calculation
export interface BiosimilarWithSavings extends Drug {
  monthlySavings: number;
  annualSavings: number;
  savingsPercent: number;
}

// Eligibility check result
export interface EligibilityResult {
  eligible: boolean;
  patientId: string;
  currentDrug: Drug;
  recommendedBiosimilars: BiosimilarWithSavings[];
  reasons: string[];
  warnings: string[];
}

// Switch Record Types
export interface SwitchRecord {
  id: string;
  patientId: string;
  patient?: Patient;
  fromDrugId: string;
  fromDrug?: Drug;
  toDrugId: string;
  toDrug?: Drug;
  switchDate: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  eligibilityNotes?: string;
  consentObtained: boolean;
  consentTimestamp?: string;
  consentText?: string;
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
  appointments?: Appointment[];
}

// Appointment Types
export interface Appointment {
  id: string;
  patientId: string;
  patient?: Patient;
  switchId: string;
  switch?: SwitchRecord;
  appointmentType: 'INITIAL' | 'DAY_3' | 'DAY_14';
  scheduledAt: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'MISSED' | 'RESCHEDULED';
  notes?: string;
  completedAt?: string;
  createdAt: string;
  followUp?: FollowUp;
  smsLogs?: SmsLog[];
}

// Follow Up Types
export interface FollowUp {
  id: string;
  appointmentId: string;
  appointment?: Appointment;
  completedAt?: string;
  hasSideEffects: boolean;
  sideEffectSeverity?: 'MILD' | 'MODERATE' | 'SEVERE';
  sideEffectDescription?: string;
  stillTakingMedication: boolean;
  needsEscalation: boolean;
  patientSatisfaction?: number;
  notes?: string;
}

// SMS Types
export interface SmsLog {
  id: string;
  patientId: string;
  patient?: Patient;
  appointmentId?: string;
  appointment?: Appointment;
  phoneNumber: string;
  message: string;
  language: 'EN' | 'ES';
  sentAt?: string;
  deliveryStatus: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  twilioSid?: string;
  errorMessage?: string;
  createdAt: string;
}

// Alert Types
export interface Alert {
  id: string;
  type: string;
  patientId: string;
  switchId?: string;
  followUpId?: string;
  description: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

// Sync Queue Types
export interface SyncQueueItem {
  id?: number;
  entityType: string;
  entityId: string;
  action: 'create' | 'update' | 'delete';
  payload: string;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Patients: undefined;
  Appointments: undefined;
  Profile: undefined;
};

export type PatientStackParamList = {
  PatientList: undefined;
  PatientDetail: { patientId: string };
  PatientForm: { patientId?: string };
  SwitchWorkflow: { patientId: string };
};
