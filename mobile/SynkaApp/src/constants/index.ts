// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api/v1', // Using USB port forwarding
  TIMEOUT: 10000, // 10 seconds (reduced for faster offline detection)
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@synka:auth_token',
  USER_DATA: '@synka:user_data',
  LANGUAGE: '@synka:language',
  LAST_SYNC: '@synka:last_sync',
};

// Professional Medical Theme Colors
export const COLORS = {
  // Primary palette - Medical teal/blue
  primary: '#0F766E',        // Teal-700 - professional medical
  primaryLight: '#14B8A6',   // Teal-500
  primaryDark: '#134E4A',    // Teal-900

  // Secondary palette
  secondary: '#1E40AF',      // Blue-800 - trust/reliability
  secondaryLight: '#3B82F6', // Blue-500

  // Status colors
  error: '#DC2626',          // Red-600
  errorLight: '#FEE2E2',     // Red-100
  warning: '#D97706',        // Amber-600
  warningLight: '#FEF3C7',   // Amber-100
  success: '#059669',        // Emerald-600
  successLight: '#D1FAE5',   // Emerald-100

  // Neutral palette
  background: '#F8FAFC',     // Slate-50
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',     // Slate-100
  text: '#0F172A',           // Slate-900
  textSecondary: '#475569',  // Slate-600
  textTertiary: '#94A3B8',   // Slate-400
  border: '#CBD5E1',         // Slate-300
  borderLight: '#E2E8F0',    // Slate-200
  disabled: '#94A3B8',       // Slate-400

  // Special colors
  highlight: '#ECFDF5',      // Emerald-50 - for savings highlights
  cardShadow: 'rgba(15, 23, 42, 0.08)',
};

// Typography
export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Language Options
export const LANGUAGES = [
  { code: 'EN', label: 'English', flag: '🇺🇸' },
  { code: 'ES', label: 'Español', flag: '🇲🇽' },
];

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  STAFF: 'STAFF',
};

// Appointment Types
export const APPOINTMENT_TYPES = {
  INITIAL: 'INITIAL',
  DAY_3: 'DAY_3',
  DAY_14: 'DAY_14',
};

// Appointment Status
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  MISSED: 'MISSED',
  RESCHEDULED: 'RESCHEDULED',
};

// Switch Status
export const SWITCH_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

// Severity Levels
export const SEVERITY = {
  MILD: 'MILD',
  MODERATE: 'MODERATE',
  SEVERE: 'SEVERE',
};

// Regex Patterns
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[+]?[(]?[0-9]{1,3}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,9}$/,
  NAME: /^[a-zA-Z\s\-']+$/,
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MM/dd/yyyy',
  DISPLAY_ES: 'dd/MM/yyyy',
  TIME: 'h:mm a',
  TIME_ES: 'HH:mm',
  DATETIME: 'MM/dd/yyyy h:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
};

// Sync Configuration
export const SYNC_CONFIG = {
  INTERVAL: 30000, // 30 seconds
  RETRY_DELAY: 5000, // 5 seconds
  MAX_RETRIES: 3,
  BATCH_SIZE: 50,
};

// Database Configuration
export const DB_CONFIG = {
  NAME: 'synka.db',
  LOCATION: 'default',
  VERSION: 1,
};

// ===========================================
// CLINICAL DATA - Diagnoses & Allergies
// ===========================================

// Diagnoses relevant to biosimilar medications
// Mapped to drug indications for eligibility checking
export const DIAGNOSES = [
  // Inflammatory/Autoimmune (TNF-Blocker indications)
  { code: 'RHEUMATOID_ARTHRITIS', label: 'Rheumatoid Arthritis', category: 'Autoimmune', drugClasses: ['TNF-Blocker'] },
  { code: 'PSORIATIC_ARTHRITIS', label: 'Psoriatic Arthritis', category: 'Autoimmune', drugClasses: ['TNF-Blocker'] },
  { code: 'ANKYLOSING_SPONDYLITIS', label: 'Ankylosing Spondylitis', category: 'Autoimmune', drugClasses: ['TNF-Blocker'] },
  { code: 'JUVENILE_IDIOPATHIC_ARTHRITIS', label: 'Juvenile Idiopathic Arthritis', category: 'Autoimmune', drugClasses: ['TNF-Blocker'] },
  { code: 'CROHNS_DISEASE', label: "Crohn's Disease", category: 'Gastrointestinal', drugClasses: ['TNF-Blocker'] },
  { code: 'ULCERATIVE_COLITIS', label: 'Ulcerative Colitis', category: 'Gastrointestinal', drugClasses: ['TNF-Blocker'] },
  { code: 'PLAQUE_PSORIASIS', label: 'Plaque Psoriasis', category: 'Dermatologic', drugClasses: ['TNF-Blocker'] },
  { code: 'HIDRADENITIS_SUPPURATIVA', label: 'Hidradenitis Suppurativa', category: 'Dermatologic', drugClasses: ['TNF-Blocker'] },
  { code: 'UVEITIS', label: 'Uveitis', category: 'Ophthalmologic', drugClasses: ['TNF-Blocker'] },

  // Oncology (HER2-Blocker & G-CSF indications)
  { code: 'HER2_BREAST_CANCER', label: 'HER2+ Breast Cancer', category: 'Oncology', drugClasses: ['HER2-Blocker'] },
  { code: 'HER2_GASTRIC_CANCER', label: 'HER2+ Gastric Cancer', category: 'Oncology', drugClasses: ['HER2-Blocker'] },
  { code: 'CHEMOTHERAPY_NEUTROPENIA', label: 'Chemotherapy-Induced Neutropenia', category: 'Oncology', drugClasses: ['G-CSF'] },
  { code: 'BONE_MARROW_TRANSPLANT', label: 'Bone Marrow Transplant', category: 'Oncology', drugClasses: ['G-CSF'] },
  { code: 'SEVERE_CHRONIC_NEUTROPENIA', label: 'Severe Chronic Neutropenia', category: 'Hematologic', drugClasses: ['G-CSF'] },

  // Other
  { code: 'OTHER', label: 'Other (specify in notes)', category: 'Other', drugClasses: [] },
];

// Common allergies relevant to biologic medications
export const ALLERGIES = [
  // Drug-specific allergies (active ingredients)
  { code: 'ADALIMUMAB', label: 'Adalimumab (Humira)', category: 'Biologic Drug', relatedDrugs: ['Humira', 'Amjevita', 'Cyltezo', 'Hadlima', 'Hyrimoz', 'Yuflyma'] },
  { code: 'INFLIXIMAB', label: 'Infliximab (Remicade)', category: 'Biologic Drug', relatedDrugs: ['Remicade', 'Inflectra', 'Renflexis', 'Avsola'] },
  { code: 'ETANERCEPT', label: 'Etanercept (Enbrel)', category: 'Biologic Drug', relatedDrugs: ['Enbrel'] },
  { code: 'TRASTUZUMAB', label: 'Trastuzumab (Herceptin)', category: 'Biologic Drug', relatedDrugs: ['Herceptin', 'Ogivri', 'Herzuma', 'Kanjinti'] },
  { code: 'FILGRASTIM', label: 'Filgrastim (Neupogen)', category: 'Biologic Drug', relatedDrugs: ['Neupogen', 'Zarxio', 'Nivestym'] },

  // Common excipient/formulation allergies
  { code: 'LATEX', label: 'Latex', category: 'Material', relatedDrugs: [] },
  { code: 'RUBBER', label: 'Rubber (needle covers)', category: 'Material', relatedDrugs: [] },
  { code: 'POLYSORBATE', label: 'Polysorbate 80', category: 'Excipient', relatedDrugs: [] },
  { code: 'SUCROSE', label: 'Sucrose', category: 'Excipient', relatedDrugs: [] },
  { code: 'MANNITOL', label: 'Mannitol', category: 'Excipient', relatedDrugs: [] },
  { code: 'CITRATE', label: 'Citrate Buffer', category: 'Excipient', relatedDrugs: [] },

  // Protein allergies
  { code: 'MURINE_PROTEINS', label: 'Murine (Mouse) Proteins', category: 'Protein', relatedDrugs: ['Remicade', 'Inflectra', 'Renflexis', 'Avsola'] },
  { code: 'CHO_PROTEINS', label: 'CHO Cell Proteins', category: 'Protein', relatedDrugs: [] },
  { code: 'ECOLI_PROTEINS', label: 'E. coli Proteins', category: 'Protein', relatedDrugs: ['Neupogen', 'Zarxio', 'Nivestym'] },

  // General
  { code: 'NKDA', label: 'No Known Drug Allergies', category: 'None', relatedDrugs: [] },
  { code: 'OTHER', label: 'Other (specify in notes)', category: 'Other', relatedDrugs: [] },
];

// Diagnosis categories for grouping in UI
export const DIAGNOSIS_CATEGORIES = [
  { code: 'Autoimmune', label: 'Autoimmune/Inflammatory' },
  { code: 'Gastrointestinal', label: 'Gastrointestinal' },
  { code: 'Dermatologic', label: 'Dermatologic' },
  { code: 'Ophthalmologic', label: 'Ophthalmologic' },
  { code: 'Oncology', label: 'Oncology' },
  { code: 'Hematologic', label: 'Hematologic' },
  { code: 'Other', label: 'Other' },
];

// Allergy categories for grouping in UI
export const ALLERGY_CATEGORIES = [
  { code: 'None', label: 'None' },
  { code: 'Biologic Drug', label: 'Biologic Medications' },
  { code: 'Material', label: 'Materials' },
  { code: 'Excipient', label: 'Excipients/Additives' },
  { code: 'Protein', label: 'Proteins' },
  { code: 'Other', label: 'Other' },
];
