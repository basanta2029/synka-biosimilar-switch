import { apiClient } from './client';

interface ResetDataResponse {
  success: boolean;
  message: string;
  deleted: {
    patients: boolean;
    switches: boolean;
    appointments: boolean;
    followUps: boolean;
    smsLogs: boolean;
    alerts: boolean;
  };
}

interface StatsResponse {
  patients: number;
  switches: number;
  appointments: number;
  followUps: number;
  drugs: number;
  users: number;
}

export const adminApi = {
  /**
   * Reset all patient data (clears patients, switches, appointments, etc.)
   * Keeps users and drug catalog intact
   */
  resetData: async (): Promise<ResetDataResponse> => {
    return apiClient.post<ResetDataResponse>('/admin/reset-data');
  },

  /**
   * Get database statistics
   */
  getStats: async (): Promise<StatsResponse> => {
    return apiClient.get<StatsResponse>('/admin/stats');
  },
};
