import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { patientsApi } from '../api/patients';
import { patientsDb } from '../database';
import { syncService } from '../services/syncService';
import { Patient, PatientFormData } from '../types';

/**
 * Hook for fetching patients with offline support
 */
export const usePatients = (searchQuery?: string) => {
  const [isOnline, setIsOnline] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch from local DB
  const {
    data: localPatients,
    isLoading: isLoadingLocal,
    refetch: refetchLocal,
  } = useQuery({
    queryKey: ['patients', 'local', searchQuery],
    queryFn: () => patientsDb.getAll(searchQuery),
    staleTime: Infinity,
  });

  // Fetch from API (only when online)
  const {
    data: apiData,
    isLoading: isLoadingApi,
    error: apiError,
  } = useQuery({
    queryKey: ['patients', 'api', searchQuery],
    queryFn: async () => {
      const response = await patientsApi.getPatients({ search: searchQuery });

      // Save API data to local DB (mark as synced)
      if (response?.patients && response.patients.length > 0) {
        await patientsDb.batchUpsertFromServer(response.patients);
        // Refetch local data to show updated patients
        queryClient.invalidateQueries({ queryKey: ['patients', 'local'] });
      }

      return response;
    },
    enabled: isOnline,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry API calls - rely on local data
  });

  return {
    patients: localPatients || [],
    isLoading: isLoadingLocal, // Only show loading for local data, not API
    isOnline,
    error: apiError,
    refetch: refetchLocal,
  };
};

/**
 * Hook for fetching a single patient
 */
export const usePatient = (patientId: string) => {
  const [isOnline, setIsOnline] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch from local DB
  const { data: localPatient, isLoading: isLoadingLocal } = useQuery({
    queryKey: ['patient', patientId, 'local'],
    queryFn: () => patientsDb.getById(patientId),
    staleTime: Infinity,
  });

  // Fetch from API (only when online)
  const { data: apiData, isLoading: isLoadingApi } = useQuery({
    queryKey: ['patient', patientId, 'api'],
    queryFn: async () => {
      const response = await patientsApi.getPatient(patientId);
      const patient = response.patient; // Extract patient from response

      // Save API data to local DB (mark as synced)
      if (patient) {
        await patientsDb.upsertFromServer(patient);
        // Refetch local data to show updated patient
        queryClient.invalidateQueries({ queryKey: ['patient', patientId, 'local'] });
      }

      return response;
    },
    enabled: isOnline && !!patientId,
    staleTime: 1000 * 60 * 5,
    retry: false, // Don't retry API calls - rely on local data
  });

  return {
    patient: localPatient,
    isLoading: isLoadingLocal, // Only show loading for local data, not API
    isOnline,
  };
};

/**
 * Hook for creating a patient
 */
export const useCreatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PatientFormData) => {
      const patientData = {
        name: data.name,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth.toISOString(),
        language: data.language,
        allergies: data.allergies,
      };

      // Try to create on server first (if online)
      try {
        const netState = await NetInfo.fetch();
        if (netState.isConnected) {
          const response = await patientsApi.createPatient(patientData);
          // Save server response to local DB (with server-generated ID)
          await patientsDb.upsertFromServer(response.patient);
          return response.patient;
        }
      } catch (error) {
        console.log('Server create failed, saving locally:', error);
      }

      // Fallback: Create in local DB and queue for sync
      const patient = await patientsDb.create(patientData);
      await syncService.queuePatientSync('create', patient.id, patient);
      return patient;
    },
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};

/**
 * Hook for updating a patient
 */
export const useUpdatePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<PatientFormData>;
    }) => {
      const updates: any = {};
      if (data.name) updates.name = data.name;
      if (data.phone) updates.phone = data.phone;
      if (data.dateOfBirth) updates.dateOfBirth = data.dateOfBirth.toISOString();
      if (data.language) updates.language = data.language;
      if (data.allergies !== undefined) updates.allergies = data.allergies;

      // Update in local DB
      await patientsDb.update(id, updates);

      // Queue for sync
      await syncService.queuePatientSync('update', id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient'] });
    },
  });
};

/**
 * Hook for deleting a patient
 */
export const useDeletePatient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (patientId: string) => {
      // Try to delete from server first (if online)
      try {
        const netState = await NetInfo.fetch();
        if (netState.isConnected) {
          await patientsApi.deletePatient(patientId);
        }
      } catch (error) {
        console.log('Server delete failed, will sync later:', error);
        // Queue for sync if server delete fails
        await syncService.queuePatientSync('delete', patientId);
      }

      // Always delete from local DB
      await patientsDb.delete(patientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
};

/**
 * Hook for sync status
 */
export const useSyncStatus = () => {
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const updateStatus = async () => {
      const count = await syncService.getQueueCount();
      setQueueCount(count);
      setIsSyncing(syncService.isSyncingNow());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  const triggerSync = async () => {
    await syncService.syncAll();
  };

  return {
    queueCount,
    isSyncing,
    triggerSync,
  };
};
