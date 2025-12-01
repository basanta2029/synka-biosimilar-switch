import { format, parseISO, addDays, differenceInYears, isAfter, isBefore } from 'date-fns';
import { DATE_FORMATS } from '../constants';

/**
 * Format date for display
 */
export const formatDate = (date: string | Date, locale: 'EN' | 'ES' = 'EN'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const formatStr = locale === 'ES' ? DATE_FORMATS.DISPLAY_ES : DATE_FORMATS.DISPLAY;
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format time for display
 */
export const formatTime = (date: string | Date, locale: 'EN' | 'ES' = 'EN'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const formatStr = locale === 'ES' ? DATE_FORMATS.TIME_ES : DATE_FORMATS.TIME;
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

/**
 * Format datetime for display
 */
export const formatDateTime = (date: string | Date, locale: 'EN' | 'ES' = 'EN'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return `${formatDate(dateObj, locale)} ${formatTime(dateObj, locale)}`;
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return '';
  }
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: string | Date): number => {
  try {
    const dob = typeof dateOfBirth === 'string' ? parseISO(dateOfBirth) : dateOfBirth;
    return differenceInYears(new Date(), dob);
  } catch (error) {
    console.error('Error calculating age:', error);
    return 0;
  }
};

/**
 * Add days to a date
 */
export const addDaysToDate = (date: string | Date, days: number): Date => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return addDays(dateObj, days);
  } catch (error) {
    console.error('Error adding days:', error);
    return new Date();
  }
};

/**
 * Check if date is in the future
 */
export const isFutureDate = (date: string | Date): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isAfter(dateObj, new Date());
  } catch (error) {
    console.error('Error checking future date:', error);
    return false;
  }
};

/**
 * Check if date is in the past
 */
export const isPastDate = (date: string | Date): boolean => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isBefore(dateObj, new Date());
  } catch (error) {
    console.error('Error checking past date:', error);
    return false;
  }
};

/**
 * Get date for API (ISO format)
 */
export const toISODate = (date: Date): string => {
  try {
    return format(date, DATE_FORMATS.ISO);
  } catch (error) {
    console.error('Error converting to ISO:', error);
    return new Date().toISOString();
  }
};
