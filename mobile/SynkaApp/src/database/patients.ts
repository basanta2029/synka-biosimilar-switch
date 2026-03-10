import { getDatabase } from './init';
import { Patient } from '../types';
import uuid from 'react-native-uuid';

export const patientsDb = {
  /**
   * Get all patients
   */
  getAll: async (searchQuery?: string): Promise<Patient[]> => {
    const db = await getDatabase();

    try {
      let query = 'SELECT * FROM patients ORDER BY createdAt DESC';
      let params: any[] = [];

      if (searchQuery) {
        query =
          'SELECT * FROM patients WHERE name LIKE ? OR phone LIKE ? ORDER BY createdAt DESC';
        params = [`%${searchQuery}%`, `%${searchQuery}%`];
      }

      const [results] = await db.executeSql(query, params);
      const patients: Patient[] = [];

      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        patients.push({
          id: row.id,
          name: row.name,
          phone: row.phone,
          dateOfBirth: row.dateOfBirth,
          language: row.language,
          allergies: row.allergies,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          synced: row.synced === 1,
        });
      }

      return patients;
    } catch (error) {
      console.error('Error getting patients:', error);
      throw error;
    }
  },

  /**
   * Get patient by ID
   */
  getById: async (id: string): Promise<Patient | null> => {
    const db = await getDatabase();

    try {
      const [results] = await db.executeSql('SELECT * FROM patients WHERE id = ?', [id]);

      if (results.rows.length > 0) {
        const row = results.rows.item(0);
        return {
          id: row.id,
          name: row.name,
          phone: row.phone,
          dateOfBirth: row.dateOfBirth,
          language: row.language,
          allergies: row.allergies,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          synced: row.synced === 1,
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting patient by ID:', error);
      throw error;
    }
  },

  /**
   * Create new patient
   */
  create: async (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'synced'>): Promise<Patient> => {
    const db = await getDatabase();

    try {
      const id = uuid.v4() as string;
      const now = new Date().toISOString();

      await db.executeSql(
        `INSERT INTO patients (id, name, phone, dateOfBirth, language, allergies, createdAt, updatedAt, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, patient.name, patient.phone, patient.dateOfBirth, patient.language, patient.allergies || null, now, now, 0]
      );

      return {
        id,
        ...patient,
        createdAt: now,
        updatedAt: now,
        synced: false,
      };
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  },

  /**
   * Update patient
   */
  update: async (id: string, updates: Partial<Patient>): Promise<void> => {
    const db = await getDatabase();

    try {
      const now = new Date().toISOString();
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.name) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      if (updates.phone) {
        fields.push('phone = ?');
        values.push(updates.phone);
      }
      if (updates.dateOfBirth) {
        fields.push('dateOfBirth = ?');
        values.push(updates.dateOfBirth);
      }
      if (updates.language) {
        fields.push('language = ?');
        values.push(updates.language);
      }
      if (updates.allergies !== undefined) {
        fields.push('allergies = ?');
        values.push(updates.allergies);
      }

      fields.push('updatedAt = ?');
      values.push(now);

      fields.push('synced = ?');
      values.push(0);

      values.push(id);

      await db.executeSql(`UPDATE patients SET ${fields.join(', ')} WHERE id = ?`, values);
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  },

  /**
   * Delete patient
   */
  delete: async (id: string): Promise<void> => {
    const db = await getDatabase();

    try {
      await db.executeSql('DELETE FROM patients WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  },

  /**
   * Mark patient as synced
   */
  markAsSynced: async (id: string): Promise<void> => {
    const db = await getDatabase();

    try {
      await db.executeSql('UPDATE patients SET synced = 1 WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error marking patient as synced:', error);
      throw error;
    }
  },

  /**
   * Get unsynced patients
   */
  getUnsynced: async (): Promise<Patient[]> => {
    const db = await getDatabase();

    try {
      const [results] = await db.executeSql('SELECT * FROM patients WHERE synced = 0');
      const patients: Patient[] = [];

      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        patients.push({
          id: row.id,
          name: row.name,
          phone: row.phone,
          dateOfBirth: row.dateOfBirth,
          language: row.language,
          allergies: row.allergies,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          synced: false,
        });
      }

      return patients;
    } catch (error) {
      console.error('Error getting unsynced patients:', error);
      throw error;
    }
  },

  /**
   * Upsert patient from server (insert or update with synced=1)
   * Respects local deletions - won't restore deleted patients
   */
  upsertFromServer: async (patient: Patient): Promise<void> => {
    const db = await getDatabase();

    try {
      // Check if this patient was locally deleted
      const [deletedResults] = await db.executeSql(
        'SELECT id FROM deleted_patients WHERE id = ?',
        [patient.id]
      );

      if (deletedResults.rows.length > 0) {
        console.log(`Skipping upsert for deleted patient ${patient.id}`);
        return;
      }

      // Check if patient exists
      const [results] = await db.executeSql('SELECT id FROM patients WHERE id = ?', [patient.id]);

      if (results.rows.length > 0) {
        // Update existing patient
        await db.executeSql(
          `UPDATE patients
           SET name = ?, phone = ?, dateOfBirth = ?, language = ?, allergies = ?,
               createdAt = ?, updatedAt = ?, synced = 1
           WHERE id = ?`,
          [
            patient.name,
            patient.phone,
            patient.dateOfBirth,
            patient.language,
            patient.allergies || null,
            patient.createdAt,
            patient.updatedAt,
            patient.id,
          ]
        );
      } else {
        // Insert new patient
        await db.executeSql(
          `INSERT INTO patients (id, name, phone, dateOfBirth, language, allergies, createdAt, updatedAt, synced)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            patient.id,
            patient.name,
            patient.phone,
            patient.dateOfBirth,
            patient.language,
            patient.allergies || null,
            patient.createdAt,
            patient.updatedAt,
          ]
        );
      }
    } catch (error) {
      console.error('Error upserting patient from server:', error);
      throw error;
    }
  },

  /**
   * Batch upsert patients from server
   * Respects local deletions - won't restore deleted patients
   */
  batchUpsertFromServer: async (patients: Patient[]): Promise<void> => {
    const db = await getDatabase();

    try {
      // Get list of locally deleted patient IDs
      const [deletedResults] = await db.executeSql('SELECT id FROM deleted_patients');
      const deletedIds = new Set<string>();
      for (let i = 0; i < deletedResults.rows.length; i++) {
        deletedIds.add(deletedResults.rows.item(i).id);
      }

      // Filter out deleted patients
      const patientsToUpsert = patients.filter((p) => !deletedIds.has(p.id));

      if (patientsToUpsert.length < patients.length) {
        console.log(`Skipping ${patients.length - patientsToUpsert.length} deleted patients from server sync`);
      }

      if (patientsToUpsert.length === 0) {
        console.log('No patients to upsert after filtering deletions');
        return;
      }

      await db.transaction((tx) => {
        patientsToUpsert.forEach((patient) => {
          tx.executeSql(
            `INSERT OR REPLACE INTO patients (id, name, phone, dateOfBirth, language, allergies, createdAt, updatedAt, synced)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              patient.id,
              patient.name,
              patient.phone,
              patient.dateOfBirth,
              patient.language,
              patient.allergies || null,
              patient.createdAt,
              patient.updatedAt,
            ]
          );
        });
      });
      console.log(`Batch upserted ${patientsToUpsert.length} patients from server`);
    } catch (error) {
      console.error('Error batch upserting patients from server:', error);
      throw error;
    }
  },

  /**
   * Track a patient deletion to prevent server sync from restoring it
   */
  trackDeletion: async (id: string): Promise<void> => {
    const db = await getDatabase();

    try {
      const now = new Date().toISOString();
      await db.executeSql(
        'INSERT OR REPLACE INTO deleted_patients (id, deletedAt, syncedDeletion) VALUES (?, ?, 0)',
        [id, now]
      );
      console.log(`Tracked deletion of patient ${id}`);
    } catch (error) {
      console.error('Error tracking patient deletion:', error);
      throw error;
    }
  },

  /**
   * Mark a deletion as synced to server
   */
  markDeletionSynced: async (id: string): Promise<void> => {
    const db = await getDatabase();

    try {
      await db.executeSql(
        'UPDATE deleted_patients SET syncedDeletion = 1 WHERE id = ?',
        [id]
      );
    } catch (error) {
      console.error('Error marking deletion as synced:', error);
      throw error;
    }
  },

  /**
   * Remove synced deletions older than given days (cleanup)
   */
  cleanupOldDeletions: async (daysOld: number = 30): Promise<number> => {
    const db = await getDatabase();

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const [countResult] = await db.executeSql(
        'SELECT COUNT(*) as count FROM deleted_patients WHERE syncedDeletion = 1 AND deletedAt < ?',
        [cutoffDate.toISOString()]
      );
      const count = countResult.rows.item(0).count;

      await db.executeSql(
        'DELETE FROM deleted_patients WHERE syncedDeletion = 1 AND deletedAt < ?',
        [cutoffDate.toISOString()]
      );

      console.log(`Cleaned up ${count} old synced deletions`);
      return count;
    } catch (error) {
      console.error('Error cleaning up old deletions:', error);
      return 0;
    }
  },

  /**
   * Check if a patient is in the deleted list
   */
  isDeleted: async (id: string): Promise<boolean> => {
    const db = await getDatabase();

    try {
      const [results] = await db.executeSql(
        'SELECT id FROM deleted_patients WHERE id = ?',
        [id]
      );
      return results.rows.length > 0;
    } catch (error) {
      console.error('Error checking if patient is deleted:', error);
      return false;
    }
  },

  /**
   * Remove from deleted list (if user re-creates patient with same ID)
   */
  untrackDeletion: async (id: string): Promise<void> => {
    const db = await getDatabase();

    try {
      await db.executeSql('DELETE FROM deleted_patients WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error untracking patient deletion:', error);
      throw error;
    }
  },
};
