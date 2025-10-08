import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../ui/button';
import { Input, InputField } from '../../ui/input';

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
  const { signUp, isLoading, error, clearError } = useAuthStore();

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

  const markTouched = (key: keyof Form) => setTouched((t) => ({ ...t, [key]: true }));

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
        if (ctx.confirmPassword && ctx.confirmPassword !== v) return;
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
      router.replace('/course-code');
    } catch (err) {
      const message = mapAuthErrorToMessage(err);
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToLogin = () => router.push('/auth/login');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <View style={styles.inner}>

          <Text style={styles.title}>Sign up</Text>

          <View style={styles.form}>
            {formError ? (
              <View style={styles.formErrorBanner}>
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            ) : null}

            {/* First Name */}
            {touched.firstName && errors.firstName ? (
              <View style={styles.formErrorBanner}>
                <Text style={styles.formErrorText}>{errors.firstName}</Text>
              </View>
            ) : null}
            <Input
              variant="outline"
              size="xl"
              style={[styles.input, touched.firstName && errors.firstName && styles.inputError]}
            >
              <InputField
                placeholder="First name"
                autoCapitalize="words"
                value={form.firstName}
                onChangeText={(v) => setField('firstName', v)}
                onBlur={() => {
                  markTouched('firstName');
                  setErrors((prev) => ({
                    ...prev,
                    firstName: validateOne('firstName', form.firstName, form),
                  }));
                }}
                returnKeyType="next"
              />
            </Input>

            {/* Last Name */}
            {touched.lastName && errors.lastName ? (
              <View style={styles.formErrorBanner}>
                <Text style={styles.formErrorText}>{errors.lastName}</Text>
              </View>
            ) : null}
            <Input
              variant="outline"
              size="xl"
              style={[styles.input, touched.lastName && errors.lastName && styles.inputError]}
            >
              <InputField
                placeholder="Last name"
                autoCapitalize="words"
                value={form.lastName}
                onChangeText={(v) => setField('lastName', v)}
                onBlur={() => {
                  markTouched('lastName');
                  setErrors((prev) => ({
                    ...prev,
                    lastName: validateOne('lastName', form.lastName, form),
                  }));
                }}
                returnKeyType="next"
              />
            </Input>

            {/* Email */}
            {touched.email && errors.email ? (
              <View style={styles.formErrorBanner}>
                <Text style={styles.formErrorText}>{errors.email}</Text>
              </View>
            ) : null}
            <Input
              variant="outline"
              size="xl"
              style={[styles.input, touched.email && errors.email && styles.inputError]}
            >
              <InputField
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={form.email}
                onChangeText={(v) => setField('email', v)}
                onBlur={() => {
                  markTouched('email');
                  setErrors((prev) => ({ ...prev, email: validateOne('email', form.email, form) }));
                }}
                returnKeyType="next"
              />
            </Input>

            {/* Password */}
            {touched.password && errors.password ? (
              <View style={styles.formErrorBanner}>
                <Text style={styles.formErrorText}>{errors.password}</Text>
              </View>
            ) : null}
            <Input
              variant="outline"
              size="xl"
              style={[styles.input, touched.password && errors.password && styles.inputError]}
            >
              <InputField
                placeholder="Password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={form.password}
                onChangeText={(v) => setField('password', v)}
                onBlur={() => {
                  markTouched('password');
                  setErrors((prev) => ({
                    ...prev,
                    password: validateOne('password', form.password, form),
                  }));
                }}
                returnKeyType="next"
              />
            </Input>

            {/* Confirm Password */}
            {touched.confirmPassword && errors.confirmPassword ? (
              <View style={styles.formErrorBanner}>
                <Text style={styles.formErrorText}>{errors.confirmPassword}</Text>
              </View>
            ) : null}
            <Input
              variant="outline"
              size="xl"
              style={[
                styles.input,
                touched.confirmPassword && errors.confirmPassword && styles.inputError,
              ]}
            >
              <InputField
                placeholder="Confirm Password"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={form.confirmPassword}
                onChangeText={(v) => setField('confirmPassword', v)}
                onBlur={() => {
                  markTouched('confirmPassword');
                  setErrors((prev) => ({
                    ...prev,
                    confirmPassword: validateOne('confirmPassword', form.confirmPassword, form),
                  }));
                }}
                returnKeyType="go"
                onSubmitEditing={handleRegister}
              />
            </Input>

            <Button
              title={submitting || isLoading ? 'Signing up…' : 'Sign Up'}
              variant="primary"
              size="lg"
              onPress={handleRegister}
              disabled={submitting || isLoading || !isValid}
              style={styles.button}
            />

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Do you already have an account?</Text>
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
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  form: { width: '100%', maxWidth: 400 },

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

  input: { marginBottom: 8 },
  inputError: { borderColor: 'red' },
  errorText: { color: 'red', fontSize: 13, marginBottom: 10, marginLeft: 4 },

  button: { marginTop: 6 },

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: { color: '#555', fontSize: 14 },
  registerLink: { color: '#000000', fontWeight: '600', fontSize: 14 },
});
