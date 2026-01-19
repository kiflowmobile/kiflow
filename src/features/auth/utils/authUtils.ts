import { authApi } from '../api/authApi';
import type { User } from '@supabase/supabase-js';
import type { AuthError } from '../types';

/**
 * Utility function to get current user from Supabase
 * This is used in services where we can't use Zustand store directly
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const { data, error } = await authApi.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return data;
};

/**
 * Utility function to get current user ID
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  const user = await getCurrentUser();
  return user?.id || null;
};

/**
 * Email validation regex
 */
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

/**
 * Normalize email (trim and lowercase)
 */
export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/**
 * Map auth error to user-friendly message
 */
export const mapAuthErrorToMessage = (err: AuthError): string => {
  const status = err?.status;
  const msg = (err?.message || '').toLowerCase();

  if (status === 400 || status === 401 || msg.includes('invalid') || msg.includes('credentials')) {
    return 'Incorrect email or password';
  }
  if (status === 403 || msg.includes('unconfirmed') || msg.includes('blocked')) {
    return 'Your account is not confirmed or is blocked';
  }
  if (status === 423 || msg.includes('temporarily locked')) {
    return 'Too many attempts. Your account is temporarily locked';
  }
  if (status === 429 || msg.includes('too many requests') || msg.includes('rate limit')) {
    return 'Too many attempts. Please try again later';
  }
  if (!status && (msg.includes('network') || msg.includes('failed to fetch'))) {
    return 'Network error. Check your connection';
  }
  if ((status ?? 0) >= 500) {
    return 'Server error. Please try again later';
  }
  return 'Authentication failed. Please try again';
};

/**
 * Check if user session is guest/anonymous
 */
export const isGuestSession = (
  session: { user?: { is_anonymous?: boolean } | null } | null,
): boolean => {
  return !session || !session.user || session.user.is_anonymous === true;
};
