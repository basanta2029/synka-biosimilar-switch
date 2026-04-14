import { Platform } from 'react-native';

const DEFAULT_API_HOST =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000' // Android emulator -> host machine loopback
    : 'http://localhost:3000'; // iOS simulator -> host machine loopback

// API Configuration
export const API_CONFIG = {
  BASE_URL: `${DEFAULT_API_HOST}/api/v1`,
  TIMEOUT: 10000, // 10 seconds (reduced for faster offline detection)
  // Network-reachable host for QR codes (so patient's phone can reach the backend)
  PUBLIC_HOST: 'http://10.0.0.99:3000',
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@synka:auth_token',
  USER_DATA: '@synka:user_data',
  LANGUAGE: '@synka:language',
  LAST_SYNC: '@synka:last_sync',
};

// Clinical deployment profile
export const CLINICAL_PROFILE = {
  id: 'GHANA_PROTOTYPE',
  label: 'Ghana Prototype',
  region: 'Ghana',
  notes: 'Prototype workflow aligned to Ghana-focused biosimilar use-cases and NHIS 2025 matching logic.',
};

// Active ingredients for BRAND drugs seeded in backend `drugService.seedDrugs()` (Ghana prototype catalog).
// Switch workflow filters API results to this set so the picker matches server data without showing stray types.
export const GHANA_TARGET_INGREDIENTS = [
  'adalimumab',
  'infliximab',
  'etanercept',
  'trastuzumab',
  'filgrastim',
  'rituximab',
  'ranibizumab',
  'epoetin', // matches seeded "epoetin alfa"
];

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

// Language Options (Ghana prototype)
export const LANGUAGES = [
  { code: 'EN', label: 'English', flag: '🇬🇭' },
  { code: 'TW', label: 'Twi', flag: '🇬🇭' },
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
  PHONE: /^\+1\d{10}$/, // US E.164 format: +1 followed by 10 digits
  NAME: /^[a-zA-Z\s\-']+$/,
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MM/dd/yyyy',
  DISPLAY_TW: 'dd/MM/yyyy',
  TIME: 'h:mm a',
  TIME_TW: 'HH:mm',
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

// Ghana-focused prototype diagnoses for biosimilar workflow
// Mapped to therapeutic classes for eligibility guidance
export const DIAGNOSES = [
  // Autoimmune/Inflammatory
  { code: 'RHEUMATOID_ARTHRITIS', label: 'Rheumatoid Arthritis (RA)', category: 'Autoimmune', drugClasses: ['TNF-Blocker'] },
  { code: 'CROHNS_DISEASE', label: "Crohn's Disease", category: 'Gastrointestinal', drugClasses: ['TNF-Blocker'] },
  { code: 'ULCERATIVE_COLITIS', label: 'Ulcerative Colitis', category: 'Gastrointestinal', drugClasses: ['TNF-Blocker'] },
  { code: 'PSORIASIS', label: 'Plaque Psoriasis', category: 'Autoimmune', drugClasses: ['TNF-Blocker'] },
  { code: 'PSORIATIC_ARTHRITIS', label: 'Psoriatic Arthritis', category: 'Autoimmune', drugClasses: ['TNF-Blocker'] },
  { code: 'ANKYLOSING_SPONDYLITIS', label: 'Ankylosing Spondylitis', category: 'Autoimmune', drugClasses: ['TNF-Blocker'] },
  { code: 'MULTIPLE_SCLEROSIS', label: 'Multiple Sclerosis', category: 'Autoimmune', drugClasses: ['Anti-CD20'] },

  // Oncology/Hematology
  { code: 'HER2_BREAST_CANCER', label: 'HER2+ Breast Cancer', category: 'Oncology', drugClasses: ['HER2-Blocker'] },
  { code: 'HER2_GASTRIC_CANCER', label: 'HER2+ Gastric Cancer', category: 'Oncology', drugClasses: ['HER2-Blocker'] },
  { code: 'NON_HODGKIN_LYMPHOMA', label: 'Non-Hodgkin Lymphoma', category: 'Hematologic', drugClasses: ['Anti-CD20'] },
  { code: 'CLL', label: 'Chronic Lymphocytic Leukemia (CLL)', category: 'Hematologic', drugClasses: ['Anti-CD20'] },
  { code: 'NEUTROPENIA', label: 'Severe Chronic Neutropenia', category: 'Hematologic', drugClasses: ['G-CSF'] },
  { code: 'CHEMOTHERAPY_NEUTROPENIA', label: 'Chemotherapy-Induced Neutropenia', category: 'Oncology', drugClasses: ['G-CSF'] },

  // Renal
  { code: 'CKD_ANEMIA', label: 'Anemia of Chronic Kidney Disease', category: 'Renal', drugClasses: ['Erythropoietin'] },
  { code: 'CHEMOTHERAPY_ANEMIA', label: 'Chemotherapy-Related Anemia', category: 'Oncology', drugClasses: ['Erythropoietin'] },

  // Ophthalmology
  { code: 'DIABETIC_MACULAR_EDEMA', label: 'Diabetic Macular Edema', category: 'Ophthalmologic', drugClasses: ['Anti-VEGF'] },
  { code: 'AGE_RELATED_MACULAR_DEGENERATION', label: 'Age-related Macular Degeneration', category: 'Ophthalmologic', drugClasses: ['Anti-VEGF'] },

  // Fallback
  { code: 'OTHER', label: 'Other (specify in notes)', category: 'Other', drugClasses: [] },
];

// Ghana-focused prototype allergy list for biologic switch checks
export const ALLERGIES = [
  // Biologic ingredients
  { code: 'ADALIMUMAB', label: 'Adalimumab', category: 'Biologic Drug', relatedDrugs: ['Humira', 'Amjevita', 'Cyltezo', 'Hadlima', 'Hyrimoz', 'Yuflyma'] },
  { code: 'INFLIXIMAB', label: 'Infliximab', category: 'Biologic Drug', relatedDrugs: ['Remicade', 'Inflectra', 'Renflexis', 'Avsola'] },
  { code: 'ETANERCEPT', label: 'Etanercept', category: 'Biologic Drug', relatedDrugs: ['Enbrel', 'Erelzi'] },
  { code: 'RITUXIMAB', label: 'Rituximab', category: 'Biologic Drug', relatedDrugs: ['MabThera', 'Truxima'] },
  { code: 'TRASTUZUMAB', label: 'Trastuzumab', category: 'Biologic Drug', relatedDrugs: ['Herceptin', 'Ogivri'] },
  { code: 'RANIBIZUMAB', label: 'Ranibizumab', category: 'Biologic Drug', relatedDrugs: ['Lucentis', 'BioUcenta'] },
  { code: 'EPOETIN', label: 'Epoetin alfa', category: 'Biologic Drug', relatedDrugs: ['Eprex', 'Binocrit'] },
  { code: 'FILGRASTIM', label: 'Filgrastim', category: 'Biologic Drug', relatedDrugs: ['Neupogen', 'Zarxio', 'Nivestym'] },
  { code: 'BEVACIZUMAB', label: 'Bevacizumab', category: 'Biologic Drug', relatedDrugs: ['Avastin', 'Mvasi', 'Zirabev'] },
  { code: 'PEGFILGRASTIM', label: 'Pegfilgrastim', category: 'Biologic Drug', relatedDrugs: ['Neulasta', 'Fulphila', 'Udenyca'] },

  // Excipients/materials/proteins
  { code: 'LATEX', label: 'Latex', category: 'Material', relatedDrugs: [] },
  { code: 'POLYSORBATE', label: 'Polysorbate 80', category: 'Excipient', relatedDrugs: [] },
  { code: 'MURINE_PROTEINS', label: 'Murine (Mouse) Proteins', category: 'Protein', relatedDrugs: ['Rituximab', 'Infliximab'] },
  { code: 'HAMSTER_PROTEIN', label: 'CHO (Hamster) Proteins', category: 'Protein', relatedDrugs: ['Adalimumab', 'Etanercept'] },
  { code: 'ECOLI_PROTEINS', label: 'E. coli Proteins', category: 'Protein', relatedDrugs: ['Neupogen', 'Zarxio', 'Nivestym'] },
  { code: 'NKDA', label: 'No Known Drug Allergies', category: 'None', relatedDrugs: [] },
  { code: 'OTHER', label: 'Other (specify in notes)', category: 'Other', relatedDrugs: [] },
];

// Diagnosis categories for grouping in UI
export const DIAGNOSIS_CATEGORIES = [
  { code: 'Autoimmune', label: 'Autoimmune/Inflammatory' },
  { code: 'Gastrointestinal', label: 'Gastrointestinal' },
  { code: 'Ophthalmologic', label: 'Ophthalmologic' },
  { code: 'Oncology', label: 'Oncology' },
  { code: 'Hematologic', label: 'Hematologic' },
  { code: 'Renal', label: 'Renal' },
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
