import { create } from 'zustand';
import { isAxiosError } from 'axios';
import { User, LoginRequest, RegisterRequest } from '../types';
import { authApi } from '../api';
import { storage } from '../utils/storage';
import { STORAGE_KEYS } from '../constants';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadUserFromStorage: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, _get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginRequest) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authApi.login(credentials);

      // Save to storage
      await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
      await storage.setItem(STORAGE_KEYS.USER_DATA, response.user);

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Login failed';
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  register: async (data: RegisterRequest) => {
    try {
      set({ isLoading: true, error: null });

      const response = await authApi.register(data);

      // Save to storage
      await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
      await storage.setItem(STORAGE_KEYS.USER_DATA, response.user);

      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Registration failed';
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      // Clear storage
      await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await storage.removeItem(STORAGE_KEYS.USER_DATA);

      // Reset state
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  loadUserFromStorage: async () => {
    try {
      set({ isLoading: true });

      const token = await storage.getItem<string>(STORAGE_KEYS.AUTH_TOKEN);
      const user = await storage.getItem<User>(STORAGE_KEYS.USER_DATA);

      if (token && user) {
        // Verify token is still valid by fetching user profile
        try {
          const { user: currentUser } = await authApi.getMe();
          set({
            user: currentUser,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Only treat explicit auth failures as "bad token". Network errors mean we cannot
          // reach the server — keep offline session using cached user + token (offline-first).
          const status = isAxiosError(error) ? error.response?.status : undefined;
          const isNetworkFailure =
            isAxiosError(error) &&
            (error.code === 'ERR_NETWORK' ||
              error.message === 'Network Error' ||
              error.response == null);

          if (isNetworkFailure || (status != null && status >= 500)) {
            if (__DEV__) {
              console.warn(
                '[auth] getMe unreachable (network or server); using cached session from storage'
              );
            }
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }

          if (status === 401 || status === 403) {
            if (__DEV__) {
              console.warn('[auth] Token rejected by server; clearing session');
            }
            await storage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            await storage.removeItem(STORAGE_KEYS.USER_DATA);
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return;
          }

          if (__DEV__) {
            console.warn('[auth] getMe failed with unexpected error; keeping cached session', error);
          }
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Load user error:', error);
      set({ isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
