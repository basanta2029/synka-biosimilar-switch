import SQLite from 'react-native-sqlite-storage';
import { DB_CONFIG } from '../constants';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

let database: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize database connection
 */
export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (database) {
    return database;
  }

  try {
    database = await SQLite.openDatabase({
      name: DB_CONFIG.NAME,
      location: DB_CONFIG.LOCATION,
    });

    console.log('Database opened successfully');

    // Create tables
    await createTables(database);

    return database;
  } catch (error) {
    console.error('Error opening database:', error);
    throw error;
  }
};

/**
 * Get database instance
 */
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!database) {
    return await initDatabase();
  }
  return database;
};

/**
 * Close database connection
 */
export const closeDatabase = async (): Promise<void> => {
  if (database) {
    await database.close();
    database = null;
    console.log('Database closed');
  }
};

/**
 * Create all database tables
 */
const createTables = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    // Patients table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        dateOfBirth TEXT NOT NULL,
        language TEXT DEFAULT 'EN',
        allergies TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );
    `);

    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
    `);

    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_patients_synced ON patients(synced);
    `);

    // Drugs table (read-only, will be synced from server)
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS drugs (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        costPerMonth REAL,
        approvedForSwitch INTEGER DEFAULT 1,
        therapeuticClass TEXT,
        manufacturer TEXT,
        description TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_drugs_type ON drugs(type);
    `);

    // Switch Records table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS switch_records (
        id TEXT PRIMARY KEY,
        patientId TEXT NOT NULL,
        fromDrugId TEXT NOT NULL,
        toDrugId TEXT NOT NULL,
        switchDate TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        eligibilityNotes TEXT,
        consentObtained INTEGER DEFAULT 0,
        consentTimestamp TEXT,
        consentText TEXT,
        completionDate TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (patientId) REFERENCES patients(id),
        FOREIGN KEY (fromDrugId) REFERENCES drugs(id),
        FOREIGN KEY (toDrugId) REFERENCES drugs(id)
      );
    `);

    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_switch_records_patient ON switch_records(patientId);
    `);

    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_switch_records_status ON switch_records(status);
    `);

    // Appointments table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        patientId TEXT NOT NULL,
        switchId TEXT NOT NULL,
        appointmentType TEXT NOT NULL,
        scheduledAt TEXT NOT NULL,
        status TEXT DEFAULT 'SCHEDULED',
        notes TEXT,
        completedAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (patientId) REFERENCES patients(id),
        FOREIGN KEY (switchId) REFERENCES switch_records(id)
      );
    `);

    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduledAt);
    `);

    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
    `);

    // Follow Ups table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS follow_ups (
        id TEXT PRIMARY KEY,
        appointmentId TEXT NOT NULL,
        completedAt TEXT,
        hasSideEffects INTEGER DEFAULT 0,
        sideEffectSeverity TEXT,
        sideEffectDescription TEXT,
        stillTakingMedication INTEGER,
        needsEscalation INTEGER DEFAULT 0,
        patientSatisfaction INTEGER,
        notes TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (appointmentId) REFERENCES appointments(id)
      );
    `);

    // SMS Logs table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS sms_logs (
        id TEXT PRIMARY KEY,
        patientId TEXT NOT NULL,
        appointmentId TEXT,
        phoneNumber TEXT NOT NULL,
        message TEXT NOT NULL,
        language TEXT,
        sentAt TEXT,
        deliveryStatus TEXT DEFAULT 'PENDING',
        twilioSid TEXT,
        errorMessage TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (patientId) REFERENCES patients(id)
      );
    `);

    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(deliveryStatus);
    `);

    // Sync Queue table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entityType TEXT NOT NULL,
        entityId TEXT NOT NULL,
        action TEXT NOT NULL,
        payload TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        retryCount INTEGER DEFAULT 0,
        lastError TEXT
      );
    `);

    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

/**
 * Clear all data from database (for testing/logout)
 */
export const clearAllData = async (): Promise<void> => {
  const db = await getDatabase();

  try {
    await db.executeSql('DELETE FROM sync_queue');
    await db.executeSql('DELETE FROM sms_logs');
    await db.executeSql('DELETE FROM follow_ups');
    await db.executeSql('DELETE FROM appointments');
    await db.executeSql('DELETE FROM switch_records');
    await db.executeSql('DELETE FROM patients');
    // Don't delete drugs as they're reference data

    console.log('All data cleared successfully');
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};
