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
  language: 'EN' | 'TW';
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
  language: 'EN' | 'TW';
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
  // Regulatory reference fields (e.g., US FDA, EMA, WHO)
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
  nhisCoverage?: {
    verificationStatus: 'MATCHED_NHIS_2025' | 'NOT_FOUND_IN_NHIS_2025' | 'NEEDS_MANUAL_REVIEW';
    isListed: boolean;
    matchedOn: 'ACTIVE_INGREDIENT' | 'GENERIC_NAME' | null;
    notes: string;
    pricing?: {
      nhisCode: string;
      genericName: string;
      unitOfPricing: string;
      priceGhs: number;
      levelOfPrescribing: string;
      sourceVersion: string;
    };
  };
}

// Eligibility check result
export interface EligibilityResult {
  eligible: boolean;
  patientSnapshot?: any;
  drugSnapshot?: Drug;
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
  patientAccessToken?: string;
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
  language: 'EN' | 'TW';
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
  entityType: 'patient' | 'switch' | 'followUp' | 'appointment';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'updateConsent';
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

/** Matches GET /api/v1/patients (backend returns `patients`, not `data`). */
export interface PaginatedResponse<T> {
  patients: T[];
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
