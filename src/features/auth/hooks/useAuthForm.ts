import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';
import { emailRegex, normalizeEmail } from '../utils/authUtils';

export interface AuthFormField {
  value: string;
  touched: boolean;
  error?: string;
}

export interface UseAuthFormOptions<T extends string> {
  fields: T[];
  validators: Record<T, (value: string, form: Record<T, string>) => string | undefined>;
  onClearAuthError?: () => void;
  authError?: string | null;
}

export function useAuthForm<T extends string>({
  fields,
  validators,
  onClearAuthError,
  authError,
}: UseAuthFormOptions<T>) {
  const [form, setForm] = useState<Record<T, string>>(
    () => Object.fromEntries(fields.map((f) => [f, ''])) as Record<T, string>,
  );
  const [touched, setTouched] = useState<Record<T, boolean>>(
    () => Object.fromEntries(fields.map((f) => [f, false])) as Record<T, boolean>,
  );
  const [errors, setErrors] = useState<Partial<Record<T, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Clear errors when form changes
  useEffect(() => {
    if (formError) setFormError(null);
    if (authError && onClearAuthError) onClearAuthError();
  }, [form]);

  const setField = useCallback((key: T, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const markTouched = useCallback((key: T) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }, []);

  const markAllTouched = useCallback(() => {
    setTouched(Object.fromEntries(fields.map((f) => [f, true])) as Record<T, boolean>);
  }, [fields]);

  const validateField = useCallback(
    (key: T): string | undefined => {
      return validators[key](form[key], form);
    },
    [form, validators],
  );

  const validateAll = useCallback((): Partial<Record<T, string>> => {
    const result: Partial<Record<T, string>> = {};
    fields.forEach((key) => {
      const msg = validateField(key);
      if (msg) result[key] = msg;
    });
    return result;
  }, [fields, validateField]);

  const handleBlur = useCallback(
    (key: T) => {
      markTouched(key);
      setErrors((prev) => ({ ...prev, [key]: validateField(key) }));
    },
    [markTouched, validateField],
  );

  const isValid = useMemo(() => {
    return Object.keys(validateAll()).length === 0;
  }, [validateAll]);

  const validate = useCallback(() => {
    markAllTouched();
    const validationErrors = validateAll();
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [markAllTouched, validateAll]);

  return {
    form,
    touched,
    errors,
    formError,
    isValid,
    setField,
    handleBlur,
    validate,
    setFormError,
    setErrors,
    markAllTouched,
  };
}

// Common validators
export const authValidators = {
  email: (value: string): string | undefined => {
    const normalized = normalizeEmail(value);
    if (!normalized) return 'Email is required';
    if (!emailRegex.test(normalized)) return 'Invalid email format';
    return undefined;
  },

  password: (value: string): string | undefined => {
    if (!value) return 'Password is required';
    return undefined;
  },

  passwordWithLength: (value: string): string | undefined => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'At least 6 characters';
    return undefined;
  },

  confirmPassword: (value: string, form: Record<string, string>): string | undefined => {
    if (!value) return 'Please confirm your password';
    if (value !== form.password) return 'Passwords do not match';
    return undefined;
  },

  name: (label: string) => (value: string): string | undefined => {
    const NAME_REGEX = /^[\p{L}\p{M}' -]{2,}$/u;
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (!normalized) return `${label} is required`;
    if (!NAME_REGEX.test(normalized)) return 'Only letters, min 2 chars';
    return undefined;
  },
};

// Navigation helper
export function useAuthRedirect(user: unknown, isGuest: boolean | null, redirectTo = '/courses') {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (user && !isGuest) {
      router.replace(redirectTo as '/courses');
    }
  }, [user, isGuest, rootNavigationState, router, redirectTo]);
}
