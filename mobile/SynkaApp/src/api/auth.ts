import { apiClient } from './client';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../types';

export const authApi = {
  /**
   * Login user
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse, LoginRequest>('/auth/login', credentials);
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse, RegisterRequest>('/auth/register', data);
  },

  /**
   * Get current user profile
   */
  getMe: async (): Promise<{ user: User }> => {
    return apiClient.get<{ user: User }>('/auth/me');
  },

  /**
   * Logout user (client-side only, no API call needed)
   */
  logout: async (): Promise<void> => {
    // Token will be removed by the auth store
    return Promise.resolve();
  },
};
