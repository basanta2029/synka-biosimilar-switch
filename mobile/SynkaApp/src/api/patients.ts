import { apiClient } from './client';
import { Patient, PaginatedResponse } from '../types';

export const patientsApi = {
  /**
   * Get all patients (with optional search)
   */
  getPatients: async (params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<Patient>> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `/patients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<PaginatedResponse<Patient>>(url);
  },

  /**
   * Get single patient by ID
   */
  getPatient: async (id: string): Promise<{ patient: Patient }> => {
    return apiClient.get<{ patient: Patient }>(`/patients/${id}`);
  },

  /**
   * Create new patient
   */
  createPatient: async (data: Partial<Patient>): Promise<{ patient: Patient }> => {
    return apiClient.post<{ patient: Patient }, Partial<Patient>>('/patients', data);
  },

  /**
   * Update patient
   */
  updatePatient: async (id: string, data: Partial<Patient>): Promise<{ patient: Patient }> => {
    return apiClient.put<{ patient: Patient }, Partial<Patient>>(`/patients/${id}`, data);
  },

  /**
   * Delete patient
   */
  deletePatient: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.delete<{ success: boolean }>(`/patients/${id}`);
  },
};
