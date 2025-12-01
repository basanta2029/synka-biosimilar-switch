import { getDatabase } from './init';
import { SyncQueueItem } from '../types';

export const syncQueueDb = {
  /**
   * Add item to sync queue
   */
  add: async (item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<number> => {
    const db = await getDatabase();

    try {
      const now = new Date().toISOString();
      const [result] = await db.executeSql(
        `INSERT INTO sync_queue (entityType, entityId, action, payload, createdAt, retryCount)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [item.entityType, item.entityId, item.action, item.payload, now, 0]
      );

      return result.insertId || 0;
    } catch (error) {
      console.error('Error adding to sync queue:', error);
      throw error;
    }
  },

  /**
   * Get all pending items
   */
  getPending: async (limit?: number): Promise<SyncQueueItem[]> => {
    const db = await getDatabase();

    try {
      const query = limit
        ? `SELECT * FROM sync_queue ORDER BY createdAt ASC LIMIT ${limit}`
        : 'SELECT * FROM sync_queue ORDER BY createdAt ASC';

      const [results] = await db.executeSql(query);
      const items: SyncQueueItem[] = [];

      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        items.push({
          id: row.id,
          entityType: row.entityType,
          entityId: row.entityId,
          action: row.action,
          payload: row.payload,
          createdAt: row.createdAt,
          retryCount: row.retryCount,
          lastError: row.lastError,
        });
      }

      return items;
    } catch (error) {
      console.error('Error getting pending sync items:', error);
      throw error;
    }
  },

  /**
   * Remove item from sync queue
   */
  remove: async (id: number): Promise<void> => {
    const db = await getDatabase();

    try {
      await db.executeSql('DELETE FROM sync_queue WHERE id = ?', [id]);
    } catch (error) {
      console.error('Error removing sync queue item:', error);
      throw error;
    }
  },

  /**
   * Update retry count and error
   */
  updateRetry: async (id: number, error?: string): Promise<void> => {
    const db = await getDatabase();

    try {
      await db.executeSql(
        'UPDATE sync_queue SET retryCount = retryCount + 1, lastError = ? WHERE id = ?',
        [error || null, id]
      );
    } catch (error) {
      console.error('Error updating sync retry:', error);
      throw error;
    }
  },

  /**
   * Get queue count
   */
  getCount: async (): Promise<number> => {
    const db = await getDatabase();

    try {
      const [results] = await db.executeSql('SELECT COUNT(*) as count FROM sync_queue');
      return results.rows.item(0).count;
    } catch (error) {
      console.error('Error getting sync queue count:', error);
      return 0;
    }
  },

  /**
   * Clear all items
   */
  clear: async (): Promise<void> => {
    const db = await getDatabase();

    try {
      await db.executeSql('DELETE FROM sync_queue');
    } catch (error) {
      console.error('Error clearing sync queue:', error);
      throw error;
    }
  },

  /**
   * Remove items by entity ID
   */
  removeByEntityId: async (entityType: string, entityId: string): Promise<void> => {
    const db = await getDatabase();

    try {
      await db.executeSql(
        'DELETE FROM sync_queue WHERE entityType = ? AND entityId = ?',
        [entityType, entityId]
      );
    } catch (error) {
      console.error('Error removing sync queue items by entity ID:', error);
      throw error;
    }
  },

  /**
   * Remove all failed items (for manual cleanup)
   */
  removeFailedItems: async (): Promise<number> => {
    const db = await getDatabase();

    try {
      const [countResult] = await db.executeSql(
        'SELECT COUNT(*) as count FROM sync_queue WHERE retryCount >= 3'
      );
      const count = countResult.rows.item(0).count;

      await db.executeSql('DELETE FROM sync_queue WHERE retryCount >= 3');

      console.log(`Removed ${count} failed sync queue items`);
      return count;
    } catch (error) {
      console.error('Error removing failed sync queue items:', error);
      return 0;
    }
  },
};
