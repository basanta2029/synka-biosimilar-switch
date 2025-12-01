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
    .matches(REGEX.PHONE, 'Invalid phone number'),
  dateOfBirth: Yup.date()
    .required('Date of birth is required')
    .max(new Date(), 'Date of birth cannot be in the future')
    .test('age', 'Patient must be at least 18 years old', function (value) {
      if (!value) return false;
      const age = new Date().getFullYear() - new Date(value).getFullYear();
      return age >= 18;
    }),
  language: Yup.string()
    .required('Language is required')
    .oneOf(['EN', 'ES'], 'Invalid language'),
  allergies: Yup.string()
    .max(500, 'Allergies must be less than 500 characters')
    .optional(),
});

// Helper functions
export const validateEmail = (email: string): boolean => {
  return REGEX.EMAIL.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return REGEX.PHONE.test(phone);
};

export const validateAge = (dateOfBirth: Date): boolean => {
  const age = new Date().getFullYear() - dateOfBirth.getFullYear();
  return age >= 18;
};

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX for 10-digit numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Return original if not 10 digits
  return phone;
};
