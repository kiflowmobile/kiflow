import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useRootNavigationState, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SafeAreaView, KeyboardAvoidingView, Button, Input } from '@/shared/ui';
import { useAuth } from '../hooks/useAuth';
import { emailRegex, normalizeEmail } from '../utils/authUtils';
import { useAnalytics } from '@/features/analytics';
import BackIcon from '@/src/assets/images/arrow-left.svg';
import OpenEye from '@/src/assets/images/eye-open.svg';
import ClosedEye from '@/src/assets/images/eye-closed.svg';
import DoneIcon from '@/src/assets/images/done.svg';

type FormFields = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormFields, string>>;
type TouchedFields = Partial<Record<keyof FormFields, boolean>>;

const NAME_REGEX = /^[\p{L}\p{M}' -]{2,}$/u;

const normalizeName = (value: string) =>
  value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\p{L}/gu, (m) => m.toUpperCase());

export function SignUpScreen() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { trackEvent } = useAnalytics();
  const { user, isLoading, error, signUp, clearError, justSignedUp } = useAuth();

  const [form, setForm] = useState<FormFields>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = useState<TouchedFields>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Track screen load
  useEffect(() => {
    trackEvent('sign_up_screen__load');
  }, [trackEvent]);

  // Redirect authenticated users
  useEffect(() => {
    if (!rootNavigationState?.key) return;

    AsyncStorage.getItem('justSignedUp').then((justSignedUpStored) => {
      if (user && !justSignedUpStored) {
        router.replace('/courses');
      }
    });
  }, [user, rootNavigationState, router]);

  // Clear errors when form changes
  useEffect(() => {
    if (formError) setFormError(null);
    if (error) clearError();
  }, [form, formError, error, clearError]);

  const setField = useCallback(<K extends keyof FormFields>(key: K, value: string) => {
    setForm((prev) => {
      let v = value;
      if (key === 'firstName' || key === 'lastName') v = v.replace(/\s+/g, ' ');
      if (key === 'email') v = v.trim();
      return { ...prev, [key]: v };
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const markTouched = (key: keyof FormFields) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const validateField = useCallback(
    (key: keyof FormFields, value: string, ctx: FormFields): string | undefined => {
      switch (key) {
        case 'firstName':
        case 'lastName': {
          const normalized = normalizeName(value);
          if (!normalized) return `${key === 'firstName' ? 'First' : 'Last'} name is required`;
          if (!NAME_REGEX.test(normalized)) return 'Only letters, min 2 chars';
          return;
        }
        case 'email': {
          const normalized = normalizeEmail(value);
          if (!normalized) return 'Email is required';
          if (/\s/.test(value) || normalized.includes('..')) return 'Invalid email format';
          if (!emailRegex.test(normalized)) return 'Invalid email format';
          return;
        }
        case 'password': {
          if (!value) return 'Password is required';
          if (value.length < 6) return 'At least 6 characters';
          return;
        }
        case 'confirmPassword': {
          if (!value) return 'Please confirm your password';
          if (value !== ctx.password) return 'Passwords do not match';
          return;
        }
      }
    },
    [],
  );

  const validateAll = useCallback(
    (f: FormFields): FormErrors => {
      const result: FormErrors = {};
      (Object.keys(f) as (keyof FormFields)[]).forEach((key) => {
        const msg = validateField(key, f[key], f);
        if (msg) result[key] = msg;
      });
      return result;
    },
    [validateField],
  );

  const isValid = useMemo(() => {
    return Object.keys(validateAll(form)).length === 0;
  }, [form, validateAll]);

  const handleBlur = (key: keyof FormFields) => {
    markTouched(key);
    setErrors((prev) => ({ ...prev, [key]: validateField(key, form[key], form) }));
  };

  const handleRegister = async () => {
    trackEvent('sign_up_screen__submit__click');

    const allTouched: TouchedFields = {
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
    };
    setTouched(allTouched);

    const validationErrors = validateAll(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    if (submitting || isLoading) return;
    setSubmitting(true);

    try {
      await signUp(
        normalizeEmail(form.email),
        form.password,
        normalizeName(form.firstName),
        normalizeName(form.lastName),
      );

      if (justSignedUp) {
        router.replace('/course-code');
      }
    } catch (err: any) {
      const status = err?.status;
      const msg = (err?.message || '').toLowerCase();

      if (status === 409 || msg.includes('already') || msg.includes('exists')) {
        setErrors((prev) => ({ ...prev, email: 'Email is already registered' }));
        setFormError('Email is already registered');
      } else if (status === 429 || msg.includes('too many')) {
        setFormError('Too many attempts. Try later');
      } else if (!status && (msg.includes('network') || msg.includes('failed to fetch'))) {
        setFormError('Network error. Check your connection');
      } else if ((status ?? 0) >= 500) {
        setFormError('Server error. Please try again later');
      } else {
        setFormError('Registration failed. Please try again');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const isFieldValid = (key: 'firstName' | 'lastName' | 'email') => {
    if (!touched[key]) return false;
    if (errors[key]) return false;

    if (key === 'email') {
      const normalized = normalizeEmail(form.email);
      return !!normalized && emailRegex.test(normalized);
    }

    const normalized = normalizeName(form[key]);
    return !!normalized && NAME_REGEX.test(normalized);
  };

  const ValidIcon = <DoneIcon width={20} height={20} />;
  const PasswordIcon = (show: boolean) =>
    show ? <OpenEye width={24} height={24} /> : <ClosedEye width={24} height={24} />;

  return (
    <SafeAreaView className="flex-1 bg-background-light">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableOpacity className="self-start mt-4 ml-4" onPress={handleGoBack} hitSlop={8}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>

        <View className="justify-center items-center p-8">
          <Text className="text-3xl font-bold mb-8 text-center leading-10">
            Create account and start learning
          </Text>

          <View className="w-full">
            {formError && (
              <View className="bg-red-50 border border-red-200 py-2.5 px-3 rounded-lg mb-3">
                <Text className="text-red-800 text-sm">{formError}</Text>
              </View>
            )}

            <Input
              value={form.firstName}
              onChangeText={(v) => setField('firstName', v)}
              onBlur={() => handleBlur('firstName')}
              placeholder="First name"
              autoCapitalize="words"
              returnKeyType="next"
              containerStyle={{ marginBottom: 12 }}
              isInvalid={touched.firstName && !!errors.firstName}
              errorMessage={touched.firstName ? errors.firstName : undefined}
              rightIcon={isFieldValid('firstName') ? ValidIcon : undefined}
            />

            <Input
              value={form.lastName}
              onChangeText={(v) => setField('lastName', v)}
              onBlur={() => handleBlur('lastName')}
              placeholder="Last name"
              autoCapitalize="words"
              returnKeyType="next"
              containerStyle={{ marginBottom: 12 }}
              isInvalid={touched.lastName && !!errors.lastName}
              errorMessage={touched.lastName ? errors.lastName : undefined}
              rightIcon={isFieldValid('lastName') ? ValidIcon : undefined}
            />

            <Input
              value={form.email}
              onChangeText={(v) => setField('email', v)}
              onBlur={() => handleBlur('email')}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              containerStyle={{ marginBottom: 12 }}
              isInvalid={touched.email && !!errors.email}
              errorMessage={touched.email ? errors.email : undefined}
              rightIcon={isFieldValid('email') ? ValidIcon : undefined}
            />

            <Input
              value={form.password}
              onChangeText={(v) => setField('password', v)}
              onBlur={() => handleBlur('password')}
              placeholder="Password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              containerStyle={{ marginBottom: 12 }}
              isInvalid={touched.password && !!errors.password}
              errorMessage={touched.password ? errors.password : undefined}
              rightIcon={PasswordIcon(showPassword)}
              onPressRightIcon={() => setShowPassword((prev) => !prev)}
            />

            <Input
              value={form.confirmPassword}
              onChangeText={(v) => setField('confirmPassword', v)}
              onBlur={() => handleBlur('confirmPassword')}
              placeholder="Confirm password"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleRegister}
              containerStyle={{ marginBottom: 12 }}
              isInvalid={touched.confirmPassword && !!errors.confirmPassword}
              errorMessage={touched.confirmPassword ? errors.confirmPassword : undefined}
              rightIcon={PasswordIcon(showConfirmPassword)}
              onPressRightIcon={() => setShowConfirmPassword((prev) => !prev)}
            />

            <Button
              title={submitting || isLoading ? 'Signing up…' : 'Create Account'}
              variant="dark"
              size="lg"
              onPress={handleRegister}
              disabled={submitting || isLoading || !isValid}
              style={{ marginTop: 6 }}
            />

            <View className="flex-row justify-center mt-4">
              <Text className="text-black font-semibold">Already have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text className="text-blue-500 font-semibold"> Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
