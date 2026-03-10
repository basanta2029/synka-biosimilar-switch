import NetInfo from '@react-native-community/netinfo';
import { patientsDb, syncQueueDb } from '../database';
import { patientsApi } from '../api';
import { Patient, SyncQueueItem } from '../types';
import { SYNC_CONFIG } from '../constants';

class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Start automatic sync
   */
  startAutoSync() {
    if (this.syncInterval) {
      return;
    }

    // Check connectivity and sync every 30 seconds
    this.syncInterval = setInterval(async () => {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        await this.syncAll();
      }
    }, SYNC_CONFIG.INTERVAL);

    console.log('Auto sync started');
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto sync stopped');
    }
  }

  /**
   * Sync all pending items
   */
  async syncAll(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return { success: 0, failed: 0 };
    }

    // Check connectivity
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      console.log('No internet connection, skipping sync');
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    let successCount = 0;
    let failedCount = 0;

    try {
      // Periodically clean up old synced deletions (every sync cycle)
      await patientsDb.cleanupOldDeletions(30);

      // STEP 1: Directly sync any unsynced patients (bypass queue to avoid race conditions)
      const unsyncedPatients = await patientsDb.getUnsynced();
      if (unsyncedPatients.length > 0) {
        console.log(`Found ${unsyncedPatients.length} unsynced patients, syncing directly...`);
        for (const patient of unsyncedPatients) {
          try {
            // Try to create on server
            const created = await patientsApi.createPatient({
              name: patient.name,
              phone: patient.phone,
              dateOfBirth: patient.dateOfBirth,
              language: patient.language,
              allergies: patient.allergies,
            });

            // Handle ID mismatch (server generates new UUID)
            if (created.patient.id !== patient.id) {
              console.log(`Server returned different ID for ${patient.name}: ${created.patient.id}`);
              // Delete old local patient
              await patientsDb.delete(patient.id);
              // Remove any queue items for old ID
              await syncQueueDb.removeByEntityId('patient', patient.id);
              // Insert server patient as synced
              await patientsDb.upsertFromServer(created.patient);
            } else {
              // IDs match - just mark as synced
              await patientsDb.markAsSynced(patient.id);
            }

            // Remove from queue if it was there
            await syncQueueDb.removeByEntityId('patient', patient.id);
            successCount++;
            console.log(`Successfully synced patient ${patient.name}`);
          } catch (error: any) {
            // Handle duplicate phone number (patient already exists on server)
            if (error?.response?.status === 400 && error?.response?.data?.error?.includes('phone')) {
              console.log(`Patient ${patient.name} already exists on server, marking as synced`);
              await patientsDb.markAsSynced(patient.id);
              await syncQueueDb.removeByEntityId('patient', patient.id);
              successCount++;
            } else {
              console.error(`Failed to sync patient ${patient.name}:`, error.message);
              failedCount++;
            }
          }
        }
      }

      // STEP 2: Process remaining queue items (updates, deletes, etc.)
      const pendingItems = await syncQueueDb.getPending(SYNC_CONFIG.BATCH_SIZE);
      // Filter out patient creates (already handled above)
      const nonCreateItems = pendingItems.filter(
        item => !(item.entityType === 'patient' && item.action === 'create')
      );

      if (nonCreateItems.length > 0) {
        console.log(`Syncing ${nonCreateItems.length} additional queue items...`);
        for (const item of nonCreateItems) {
          try {
            await this.syncItem(item);
            await syncQueueDb.remove(item.id!);
            successCount++;
          } catch (error: any) {
            console.error(`Failed to sync item ${item.id}:`, error.message);
            await syncQueueDb.updateRetry(item.id!, error.message);
            if (item.retryCount >= SYNC_CONFIG.MAX_RETRIES) {
              console.log(`Max retries exceeded for item ${item.id}, removing from queue`);
              await syncQueueDb.remove(item.id!);
            }
            failedCount++;
          }
        }
      }

      // STEP 3: Clean up any stale queue items for patients that are now synced
      const allQueueItems = await syncQueueDb.getPending(1000);
      for (const item of allQueueItems) {
        if (item.entityType === 'patient' && item.action === 'create') {
          const patient = await patientsDb.getById(item.entityId);
          if (!patient || patient.synced) {
            console.log(`Removing stale queue item for patient ${item.entityId}`);
            await syncQueueDb.remove(item.id!);
          }
        }
      }

      console.log(`Sync complete: ${successCount} success, ${failedCount} failed`);
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Sync a single item
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    const payload = JSON.parse(item.payload);

    switch (item.entityType) {
      case 'patient':
        await this.syncPatient(item.action, item.entityId, payload);
        break;
      default:
        console.warn(`Unknown entity type: ${item.entityType}`);
    }
  }

  /**
   * Sync patient entity
   */
  private async syncPatient(
    action: 'create' | 'update' | 'delete',
    entityId: string,
    payload: any
  ): Promise<void> {
    switch (action) {
      case 'create':
        // Include local ID so server uses it (offline-first architecture)
        const { synced, ...patientData } = payload;

        try {
          // Create on server with local ID
          const created = await patientsApi.createPatient(patientData);

          // Check if server returned a different ID (server generated new UUID)
          if (created.patient.id !== entityId) {
            console.log(`Server returned different ID: ${created.patient.id} vs local: ${entityId}`);

            // Delete the old local patient with client-generated ID
            await patientsDb.delete(entityId);

            // Remove any sync queue items for the old local ID
            await syncQueueDb.removeByEntityId('patient', entityId);

            // Insert/update with server ID and mark as synced
            await patientsDb.upsertFromServer(created.patient);

            console.log(`Replaced local patient ${entityId} with server patient ${created.patient.id}`);
          } else {
            // IDs match - just mark as synced
            await patientsDb.markAsSynced(entityId);
            console.log(`Patient ${entityId} created on server with matching ID`);
          }
        } catch (error: any) {
          // Check if it's a duplicate phone number error (400)
          if (error?.response?.status === 400 && error?.response?.data?.error?.includes('phone number')) {
            console.log(`Patient with phone ${patientData.phone} already exists on server, cleaning up local entry`);

            // Delete the local patient that failed to sync
            await patientsDb.delete(entityId);

            // Remove from sync queue to prevent retrying
            await syncQueueDb.removeByEntityId('patient', entityId);

            console.log(`Cleaned up local patient ${entityId} that already exists on server`);
            return; // Don't throw error, consider it handled
          }

          // Re-throw other errors
          throw error;
        }
        break;

      case 'update':
        // Remove fields that shouldn't be sent in update
        const { id: updateId, synced: updateSynced, createdAt: updateCreatedAt, updatedAt: updateUpdatedAt, ...updateData } = payload;

        // Update on server
        await patientsApi.updatePatient(entityId, updateData);
        // Mark as synced in local DB
        await patientsDb.markAsSynced(entityId);
        console.log(`Patient ${entityId} updated on server`);
        break;

      case 'delete':
        // Delete on server
        try {
          await patientsApi.deletePatient(entityId);
          console.log(`Patient ${entityId} deleted on server`);
        } catch (error: any) {
          // 404 means patient doesn't exist on server - that's fine, it's deleted
          if (error?.response?.status === 404) {
            console.log(`Patient ${entityId} already deleted from server (404)`);
          } else {
            throw error;
          }
        }
        // Mark the deletion as synced so we can clean it up later
        await patientsDb.markDeletionSynced(entityId);
        break;
    }
  }

  /**
   * Add patient to sync queue
   */
  async queuePatientSync(
    action: 'create' | 'update' | 'delete',
    patientId: string,
    patientData?: Partial<Patient>
  ): Promise<void> {
    await syncQueueDb.add({
      entityType: 'patient',
      entityId: patientId,
      action,
      payload: JSON.stringify(patientData || {}),
    });

    console.log(`Patient ${patientId} queued for ${action}`);

    // Try to sync immediately if online
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      this.syncAll().catch(console.error);
    }
  }

  /**
   * Clear all pending sync operations for a patient
   * Used when deleting a patient to prevent orphaned queue items
   */
  async clearPatientSyncQueue(patientId: string): Promise<void> {
    await syncQueueDb.removeByEntityId('patient', patientId);
    console.log(`Cleared sync queue for patient ${patientId}`);
  }

  /**
   * Get sync queue count
   */
  async getQueueCount(): Promise<number> {
    return syncQueueDb.getCount();
  }

  /**
   * Check if currently syncing
   */
  isSyncingNow(): boolean {
    return this.isSyncing;
  }

  /**
   * Re-queue all unsynced patients
   * Returns the number of patients queued (does NOT trigger sync - caller should call syncAll)
   */
  async requeueUnsyncedPatients(): Promise<number> {
    try {
      const unsyncedPatients = await patientsDb.getUnsynced();
      console.log(`Found ${unsyncedPatients.length} unsynced patients`);

      let queuedCount = 0;
      for (const patient of unsyncedPatients) {
        // Check if already in queue
        const existingQueueItem = await syncQueueDb.getPending(1000);
        const alreadyQueued = existingQueueItem.some(
          (item) => item.entityId === patient.id && item.entityType === 'patient'
        );

        if (!alreadyQueued) {
          // Queue without triggering immediate sync
          await syncQueueDb.add({
            entityType: 'patient',
            entityId: patient.id,
            action: 'create',
            payload: JSON.stringify(patient),
          });
          console.log(`Re-queued patient ${patient.id} for sync`);
          queuedCount++;
        }
      }

      return queuedCount;
    } catch (error) {
      console.error('Error requeuing unsynced patients:', error);
      return 0;
    }
  }

  /**
   * Clean up duplicate patients (same phone number)
   * Keeps the patient with matching server ID or the synced one
   */
  async cleanupDuplicatePatients(): Promise<number> {
    try {
      // Get all local patients
      const allPatients = await patientsDb.getAll();

      // Group by phone number
      const phoneMap = new Map<string, typeof allPatients>();
      for (const patient of allPatients) {
        if (!phoneMap.has(patient.phone)) {
          phoneMap.set(patient.phone, []);
        }
        phoneMap.get(patient.phone)!.push(patient);
      }

      let duplicatesRemoved = 0;

      // Find and remove duplicates
      for (const [phone, patients] of phoneMap.entries()) {
        if (patients.length > 1) {
          console.log(`Found ${patients.length} patients with phone ${phone}`);

          // Keep the synced one, or the first one if multiple are synced
          const synced = patients.find((p) => p.synced);
          const toKeep = synced || patients[0];

          // Delete the others
          for (const patient of patients) {
            if (patient.id !== toKeep.id) {
              await patientsDb.delete(patient.id);
              // Also remove any sync queue items for the duplicate
              await syncQueueDb.removeByEntityId('patient', patient.id);
              console.log(`Deleted duplicate patient ${patient.id} (${patient.name})`);
              duplicatesRemoved++;
            }
          }
        }
      }

      console.log(`Cleanup complete: removed ${duplicatesRemoved} duplicate patients`);
      return duplicatesRemoved;
    } catch (error) {
      console.error('Error cleaning up duplicates:', error);
      return 0;
    }
  }

  /**
   * Clear failed sync queue items
   */
  async clearFailedSyncItems(): Promise<number> {
    try {
      const count = await syncQueueDb.removeFailedItems();
      console.log(`Removed ${count} failed sync items from queue`);
      return count;
    } catch (error) {
      console.error('Error clearing failed sync items:', error);
      return 0;
    }
  }
}

export const syncService = new SyncService();
