import { apiClient } from './client';
import { Drug, SwitchRecord, EligibilityResult } from '../types';

export interface CreateSwitchRequest {
  patientId: string;
  fromDrugId: string;
  toDrugId: string;
  eligibilityNotes?: string;
}

export interface ConsentRequest {
  consentText: string;
  consentObtained: boolean;
}

export interface FollowUpRequest {
  hasSideEffects: boolean;
  sideEffectSeverity?: 'MILD' | 'MODERATE' | 'SEVERE';
  sideEffectDescription?: string;
  stillTakingMedication: boolean;
  patientSatisfaction?: number;
  notes?: string;
}

export interface DashboardStats {
  totalSwitches: number;
  pendingSwitches: number;
  completedSwitches: number;
  failedSwitches: number;
  successRate: number;
  upcomingAppointments: number;
  unreviewedAlerts: number;
  totalMonthlySavings: number;
  totalAnnualSavings: number;
}

export const switchesApi = {
  /**
   * Get all drugs (optionally filtered by type)
   */
  getDrugs: async (type?: 'BRAND' | 'BIOSIMILAR'): Promise<{ drugs: Drug[] }> => {
    const url = type ? `/drugs?type=${type}` : '/drugs';
    return apiClient.get(url);
  },

  /**
   * Get drug by ID
   */
  getDrugById: async (id: string): Promise<{ drug: Drug }> => {
    return apiClient.get(`/drugs/${id}`);
  },

  /**
   * Get biosimilar alternatives for a brand drug
   */
  getBiosimilarAlternatives: async (brandDrugId: string): Promise<{
    brandDrug: Drug;
    biosimilars: any[];
    totalBiosimilars: number;
    interchangeableCount: number;
  }> => {
    return apiClient.get(`/drugs/${brandDrugId}/biosimilars`);
  },

  /**
   * Check patient eligibility for biosimilar switch
   */
  checkEligibility: async (patientId: string, currentDrugId: string): Promise<EligibilityResult> => {
    return apiClient.post('/switches/eligibility', { patientId, currentDrugId });
  },

  /**
   * Create a new switch record
   */
  createSwitch: async (data: CreateSwitchRequest): Promise<{ switch: SwitchRecord }> => {
    return apiClient.post('/switches', data);
  },

  /**
   * Get all switches (optionally filtered)
   */
  getSwitches: async (filters?: { status?: string; patientId?: string }): Promise<{ switches: SwitchRecord[]; count: number }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.patientId) params.append('patientId', filters.patientId);
    const queryString = params.toString();
    return apiClient.get(`/switches${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get switch by ID
   */
  getSwitchById: async (id: string): Promise<{ switch: SwitchRecord }> => {
    return apiClient.get(`/switches/${id}`);
  },

  /**
   * Get switches for a patient
   */
  getPatientSwitches: async (patientId: string): Promise<{ switches: SwitchRecord[]; count: number }> => {
    return apiClient.get(`/switches/patient/${patientId}`);
  },

  /**
   * Record patient consent
   */
  recordConsent: async (switchId: string, data: ConsentRequest): Promise<{ switch: SwitchRecord; message: string }> => {
    return apiClient.post(`/switches/${switchId}/consent`, data);
  },

  /**
   * Complete a switch
   */
  completeSwitch: async (switchId: string): Promise<{ switch: SwitchRecord; message: string }> => {
    return apiClient.post(`/switches/${switchId}/complete`);
  },

  /**
   * Cancel a switch
   */
  cancelSwitch: async (switchId: string, reason?: string): Promise<{ switch: SwitchRecord; message: string }> => {
    return apiClient.post(`/switches/${switchId}/cancel`, { reason });
  },

  /**
   * Record follow-up data
   */
  recordFollowUp: async (appointmentId: string, data: FollowUpRequest): Promise<{ followUp: any; message: string }> => {
    return apiClient.post(`/switches/appointments/${appointmentId}/followup`, data);
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    return apiClient.get('/switches/dashboard/stats');
  },

  /**
   * Get all appointments with optional filtering
   */
  getAppointments: async (filters?: { status?: string; patientId?: string; upcoming?: boolean }): Promise<{ appointments: any[]; count: number }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.patientId) params.append('patientId', filters.patientId);
    if (filters?.upcoming) params.append('upcoming', 'true');
    const queryString = params.toString();
    return apiClient.get(`/switches/appointments${queryString ? `?${queryString}` : ''}`);
  },
};
