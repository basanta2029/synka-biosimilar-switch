import * as Yup from 'yup';
import { REGEX } from '../constants';

// Login validation schema
export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .required('Email is required')
    .email('Invalid email address'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

// Register validation schema (relaxed requirements)
export const registerSchema = Yup.object().shape({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: Yup.string()
    .required('Email is required')
    .email('Invalid email address'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
});

// Patient validation schema
export const patientSchema = Yup.object().shape({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  phone: Yup.string()
    .required('Phone number is required')
    .test('us-phone', 'Enter a valid US number: +1XXXXXXXXXX', function (value) {
      if (!value) return false;
      // Auto-normalize: strip spaces/dashes/parens, prepend +1 if needed
      const normalized = normalizeUSPhone(value);
      return REGEX.PHONE.test(normalized);
    }),
  dateOfBirth: Yup.date()
    .required('Date of birth is required')
    .max(new Date(), 'Date of birth cannot be in the future')
    .test('age', 'Patient must be at least 18 years old', function (value) {
      if (!value) return false;
      const today = new Date();
      const dob = new Date(value);
      let age = today.getFullYear() - dob.getFullYear();
      const hadBirthdayThisYear =
        today.getMonth() > dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
      if (!hadBirthdayThisYear) age--;
      return age >= 18;
    }),
  language: Yup.string()
    .required('Language is required')
    .oneOf(['EN', 'TW'], 'Invalid language'),
  diagnosis: Yup.string().optional(),
  allergies: Yup.array()
    .of(Yup.string())
    .optional(),
});

// Helper functions
export const validateEmail = (email: string): boolean => {
  return REGEX.EMAIL.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return REGEX.PHONE.test(normalizeUSPhone(phone));
};

/**
 * Normalize any reasonable US phone input to E.164 (+1XXXXXXXXXX).
 * Accepts: 2025551234, +12025551234, (202) 555-1234, 1-202-555-1234, etc.
 */
export const normalizeUSPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  // Already has + prefix
  if (phone.startsWith('+1') && digits.length === 11) return `+${digits}`;
  return phone; // return as-is so validation fails on bad input
};

export const validateAge = (dateOfBirth: Date): boolean => {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const hadBirthdayThisYear =
    today.getMonth() > dateOfBirth.getMonth() ||
    (today.getMonth() === dateOfBirth.getMonth() && today.getDate() >= dateOfBirth.getDate());
  if (!hadBirthdayThisYear) age--;
  return age >= 18;
};

export const formatPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');

  // Format as +1 (XXX) XXX-XXXX for display
  if (digits.length === 10) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phone;
};
