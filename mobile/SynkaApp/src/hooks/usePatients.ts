import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { patientsApi } from '../api/patients';
import { patientsDb } from '../database';
import { syncService } from '../services/syncService';
import { PatientFormData } from '../types';

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
    staleTime: 0, // Always refetch on invalidation so new/edited patients appear immediately
  });

  // Fetch from API (only when online)
  const { error: apiError, refetch: refetchApi } = useQuery({
    queryKey: ['patients', 'api', searchQuery],
    queryFn: async () => {
      const response = await patientsApi.getPatients({ search: searchQuery });

      // Save API data to local DB (mark as synced)
      if (response.patients?.length) {
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

  const refetchAll = async () => {
    if (isOnline) {
      await refetchApi();
    }
    await refetchLocal();
  };

  return {
    patients: localPatients || [],
    isLoading: isLoadingLocal,
    isOnline,
    error: apiError,
    refetch: refetchAll,
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
    staleTime: 0,
  });

  // Fetch from API (only when online)
  useQuery({
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
        diagnosis: data.diagnosis,
        allergies: data.allergies?.join(',') || '',
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
      if (data.diagnosis !== undefined) updates.diagnosis = data.diagnosis;
      if (data.allergies !== undefined) updates.allergies = data.allergies?.join(',') || '';

      // Update in local DB first
      await patientsDb.update(id, updates);

      // Try to update on server directly (if online)
      try {
        const netState = await NetInfo.fetch();
        if (netState.isConnected) {
          await patientsApi.updatePatient(id, updates);
          await patientsDb.markAsSynced(id);
          // Clear any stale queue items for this patient
          await syncService.clearPatientSyncQueue(id);
          return;
        }
      } catch (error: any) {
        console.warn('Direct patient update failed, falling back to queue:', error?.response?.data || error.message);
      }

      // Fallback: queue for sync (offline or server call failed)
      await syncService.queuePatientSync('update', id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      queryClient.invalidateQueries({ queryKey: ['patient'] });
      queryClient.invalidateQueries({ queryKey: ['switches'] });
      DeviceEventEmitter.emit('dashboard-refresh');
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
      const netState = await NetInfo.fetch();

      // First, clear any pending create/update operations for this patient
      // to prevent conflicts in the sync queue
      await syncService.clearPatientSyncQueue(patientId);

      if (netState.isConnected) {
        // If online, try to delete from server immediately
        try {
          await patientsApi.deletePatient(patientId);
          console.log(`Patient ${patientId} deleted from server`);
        } catch (error: any) {
          // If 404, patient doesn't exist on server (already deleted or never synced)
          if (error?.response?.status !== 404) {
            console.log('Server delete failed:', error);
            // Queue for sync if it fails for reasons other than 404
            await syncService.queuePatientSync('delete', patientId);
          }
        }
      } else {
        // If offline, queue the delete for later sync
        console.log('Offline - queuing delete for sync');
        await syncService.queuePatientSync('delete', patientId);
      }

      // Track this deletion locally to prevent server data from restoring it
      await patientsDb.trackDeletion(patientId);

      // Delete from local DB
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
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const updateStatus = async () => {
      // Get sync queue count
      const queue = await syncService.getQueueCount();
      setQueueCount(queue);

      // Also get unsynced patients count (orphaned items not in queue)
      try {
        const unsyncedPatients = await patientsDb.getUnsynced();
        setUnsyncedCount(unsyncedPatients.length);
      } catch (error) {
        console.error('Error getting unsynced patients:', error);
      }

      setIsSyncing(syncService.isSyncingNow());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  const triggerSync = async () => {
    await syncService.syncAll();
  };

  // Total pending = items in queue + orphaned unsynced patients
  const totalPending = Math.max(queueCount, unsyncedCount);

  return {
    queueCount: totalPending, // Return total pending for display
    unsyncedCount,
    isSyncing,
    triggerSync,
  };
};
