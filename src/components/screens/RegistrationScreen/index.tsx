import { useAuthStore } from '@/src/stores/authStore';
import { useRootNavigationState, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Button from '../../ui/button';
import Input from '../../ui/input';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import { Colors } from '@/src/constants/Colors';
import BackIcon from '@/src/assets/images/arrow-left.svg';
import OpenEye from '@/src/assets/images/eye-open.svg';
import ClosedEye from '@/src/assets/images/eye-closed.svg';
import DoneIcon from '@/src/assets/images/done.svg';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};
type Errors = Partial<Record<keyof Form, string>>;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const onlyLettersRegex = /^[\p{L}\p{M}' -]{2,}$/u;

const normalizeName = (v: string) =>
  v
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\p{L}/gu, (m) => m.toUpperCase());

const normalizeEmail = (v: string) => v.trim().toLowerCase();

export default function RegisterScreen() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const analyticsStore = useAnalyticsStore.getState();

  const user = useAuthStore((state) => state.user);
  const signUp = useAuthStore((state) => state.signUp);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [form, setForm] = useState<Form>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const setField = useCallback(
    <K extends keyof Form>(key: K, value: string) => {
      setForm((prev) => {
        let v = value;
        if (key === 'firstName' || key === 'lastName') v = v.replace(/\s+/g, ' ');
        if (key === 'email') v = v.trim();
        return { ...prev, [key]: v };
      });
      setErrors((prev) => ({ ...prev, [key]: undefined }));
      if (formError) setFormError(null);
      if (error) clearError();
    },
    [clearError, error, formError],
  );

  const markTouched = (key: keyof Form) =>
    setTouched((t) => ({
      ...t,
      [key]: true,
    }));

  const validateOne = useCallback((k: keyof Form, v: string, ctx: Form): string | undefined => {
    switch (k) {
      case 'firstName': {
        const n = normalizeName(v);
        if (!n) return 'First name is required';
        if (!onlyLettersRegex.test(n)) return 'Only letters, min 2 chars';
        return;
      }
      case 'lastName': {
        const n = normalizeName(v);
        if (!n) return 'Last name is required';
        if (!onlyLettersRegex.test(n)) return 'Only letters, min 2 chars';
        return;
      }
      case 'email': {
        const e = normalizeEmail(v);
        if (!e) return 'Email is required';
        if (/\s/.test(v) || e.includes('..')) return 'Invalid email format';
        if (!emailRegex.test(e)) return 'Invalid email format';
        return;
      }
      case 'password': {
        if (!v) return 'Password is required';
        if (v.length < 6) return 'At least 6 characters';
        return;
      }
      case 'confirmPassword': {
        if (!v) return 'Please confirm your password';
        if (v !== ctx.password) return 'Passwords do not match';
        return;
      }
      default:
        return;
    }
  }, []);

  const validateAll = useCallback(
    (f: Form): Errors => {
      const next: Errors = {};
      (Object.keys(f) as (keyof Form)[]).forEach((k) => {
        const msg = validateOne(k, f[k], f);
        if (msg) next[k] = msg;
      });
      return next;
    },
    [validateOne],
  );

  const isValid = useMemo(() => {
    const e = validateAll(form);
    return Object.keys(e).length === 0;
  }, [form, validateAll]);

  const mapAuthErrorToMessage = (err: any): string => {
    const status = err?.status;
    const msg = (err?.message || '').toLowerCase();

    if (status === 409 || msg.includes('already') || msg.includes('exists')) {
      setErrors((prev) => ({ ...prev, email: 'Email is already registered' }));
      return 'Email is already registered';
    }
    if (status === 400 || msg.includes('invalid')) return 'Invalid data. Check fields';
    if (status === 403 || msg.includes('blocked') || msg.includes('unconfirmed'))
      return 'Account not confirmed or blocked';
    if (status === 429 || msg.includes('too many')) return 'Too many attempts. Try later';
    if (!status && (msg.includes('network') || msg.includes('failed to fetch')))
      return 'Network error. Check your connection';
    if ((status ?? 0) >= 500) return 'Server error. Please try again later';
    return 'Registration failed. Please try again';
  };

  const handleRegister = async () => {
    analyticsStore.trackEvent('sign_up_screen__submit__click');

    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    const nextErrors = validateAll(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (submitting || isLoading) return;
    setSubmitting(true);

    try {
      await signUp(
        normalizeEmail(form.email),
        form.password,
        normalizeName(form.firstName),
        normalizeName(form.lastName),
      );

      const updatedJustSignedUp = useAuthStore.getState().justSignedUp;
      if (updatedJustSignedUp) {
        router.replace('/course-code');
      }
    } catch (err) {
      const message = mapAuthErrorToMessage(err);
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToLogin = () => router.push('/auth/login');

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const checkRedirect = async () => {
      const justSignedUpStored = await AsyncStorage.getItem('justSignedUp');

      if (user && !justSignedUpStored) {
        setTimeout(() => {
          router.replace('/courses');
        }, 0);
      }
    };

    checkRedirect();
  }, [user, rootNavigationState, router]);

    const handleGoBack = () => {
      try {
        // expo-router silently ignores back() if there is no history entry
        router.back();
      } catch {
        router.push('/');
      }
    };
  
  useEffect(() => {
    analyticsStore.trackEvent('sign_up_screen__load');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFirstNameValid = useMemo(() => {
    if (!touched.firstName) return false;
    const n = normalizeName(form.firstName);
    if (!n) return false;
    return onlyLettersRegex.test(n) && !errors.firstName;
  }, [form.firstName, touched.firstName, errors.firstName]);

  const isLastNameValid = useMemo(() => {
    if (!touched.lastName) return false;
    const n = normalizeName(form.lastName);
    if (!n) return false;
    return onlyLettersRegex.test(n) && !errors.lastName;
  }, [form.lastName, touched.lastName, errors.lastName]);

  const isEmailValid = useMemo(() => {
    if (!touched.email) return false;
    const e = normalizeEmail(form.email);
    if (!e) return false;
    if (/\s/.test(form.email) || e.includes('..')) return false;
    return emailRegex.test(e) && !errors.email;
  }, [form.email, touched.email, errors.email]);

  const renderValidIcon = () => (
    <DoneIcon width={20} height={20} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack} hitSlop={8}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>
        <View style={styles.inner}>
          <Text style={styles.title}>Create account and start learning </Text>

          <View style={styles.form}>
            {formError ? (
              <View style={styles.formErrorBanner}>
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            ) : null}

            {/* First Name */}
            <Input
              value={form.firstName}
              onChangeText={(v) => setField('firstName', v)}
              onBlur={() => {
                markTouched('firstName');
                setErrors((prev) => ({
                  ...prev,
                  firstName: validateOne('firstName', form.firstName, form),
                }));
              }}
              placeholder="First name"
              autoCapitalize="words"
              returnKeyType="next"
              containerStyle={styles.input}
              isInvalid={touched.firstName && !!errors.firstName}
              errorMessage={touched.firstName ? errors.firstName : undefined}
              rightIcon={isFirstNameValid ? renderValidIcon() : undefined}
            />

            {/* Last Name */}
            <Input
              value={form.lastName}
              onChangeText={(v) => setField('lastName', v)}
              onBlur={() => {
                markTouched('lastName');
                setErrors((prev) => ({
                  ...prev,
                  lastName: validateOne('lastName', form.lastName, form),
                }));
              }}
              placeholder="Last name"
              autoCapitalize="words"
              returnKeyType="next"
              containerStyle={styles.input}
              isInvalid={touched.lastName && !!errors.lastName}
              errorMessage={touched.lastName ? errors.lastName : undefined}
              rightIcon={isLastNameValid ? renderValidIcon() : undefined}
            />

            {/* Email */}
            <Input
              value={form.email}
              onChangeText={(v) => setField('email', v)}
              onBlur={() => {
                markTouched('email');
                setErrors((prev) => ({
                  ...prev,
                  email: validateOne('email', form.email, form),
                }));
              }}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              containerStyle={styles.input}
              isInvalid={touched.email && !!errors.email}
              errorMessage={touched.email ? errors.email : undefined}
              rightIcon={isEmailValid ? renderValidIcon() : undefined}
            />

            {/* Password */}
            <Input
              value={form.password}
              onChangeText={(v) => setField('password', v)}
              onBlur={() => {
                markTouched('password');
                setErrors((prev) => ({
                  ...prev,
                  password: validateOne('password', form.password, form),
                }));
              }}
              placeholder="Password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              returnKeyType="next"
              containerStyle={styles.input}
              isInvalid={touched.password && !!errors.password}
              errorMessage={touched.password ? errors.password : undefined}
              rightIcon={
                showPassword ? (
                  <OpenEye width={24} height={24} />
                ) : (
                  <ClosedEye width={24} height={24} />
                )
              }
              onPressRightIcon={() => setShowPassword((prev) => !prev)}
            />

            {/* Confirm Password */}
            <Input
              value={form.confirmPassword}
              onChangeText={(v) => setField('confirmPassword', v)}
              onBlur={() => {
                markTouched('confirmPassword');
                setErrors((prev) => ({
                  ...prev,
                  confirmPassword: validateOne('confirmPassword', form.confirmPassword, form),
                }));
              }}
              placeholder="Confirm password"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleRegister}
              containerStyle={styles.input}
              isInvalid={touched.confirmPassword && !!errors.confirmPassword}
              errorMessage={touched.confirmPassword ? errors.confirmPassword : undefined}
              rightIcon={
                showPassword ? (
                  <OpenEye width={24} height={24} />
                ) : (
                  <ClosedEye width={24} height={24} />
                )
              }
              onPressRightIcon={() => setShowConfirmPassword((prev) => !prev)}
            />

            <Button
              title={submitting || isLoading ? 'Signing up…' : 'Create Account'}
              variant="dark"
              size="lg"
              onPress={handleRegister}
              disabled={submitting || isLoading || !isValid}
              style={styles.button}
            />

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Already have an account?</Text>
              <TouchableOpacity onPress={handleGoToLogin}>
                <Text style={styles.registerLink}> Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  keyboardContainer: { flex: 1 },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    marginLeft: 16,
  },
  inner: { justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { marginBottom: 32, ...TEXT_VARIANTS.largeTitle, textAlign: 'center', lineHeight: 40 },
  form: {
    width: '100%',
  },

  formErrorBanner: {
    backgroundColor: '#fdecea',
    borderColor: '#f5c2c0',
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  formErrorText: { color: '#8a1c1c', fontSize: 14 },

  input: { marginBottom: 12 },

  button: { marginTop: 6 },

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: { ...TEXT_VARIANTS.title3 , color: Colors.black },
  registerLink: { color: Colors.blue, ...TEXT_VARIANTS.title3, },
});
