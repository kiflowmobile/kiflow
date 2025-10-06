// src/screens/Auth/LoginScreen.tsx
import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../ui/button';
import { Input, InputField } from '../../ui/input';

interface AuthError {
  message?: string;
  status?: number;
  code?: string;
  [key: string]: unknown;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});

  const [formError, setFormError] = useState<string | null>(null);

  const router = useRouter();

  // Zustand store
  const { signIn, isLoading, error, clearError } = useAuthStore();

  const windowWidth = Dimensions.get('window').width;

  const normalizeEmail = (value: string) => value.trim().toLowerCase();
  const normalizePassword = (value: string) => value;

  const validate = (nextEmail = email, nextPassword = password) => {
    const nextErrors: typeof errors = {};

    const e = normalizeEmail(nextEmail);
    if (!e) nextErrors.email = 'Email is required';
    else if (!emailRegex.test(e)) nextErrors.email = 'Invalid email format';

    const p = normalizePassword(nextPassword);
    if (!p) nextErrors.password = 'Password is required';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const isValid = useMemo(() => {
    return emailRegex.test(normalizeEmail(email)) && !!password;
  }, [email, password]);

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((t) => ({ ...t, [field]: true }));
    validate();
  };

  useEffect(() => {
    if (formError) setFormError(null);
    if (error) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  const mapAuthErrorToMessage = (err: AuthError): string => {
    const status = err?.status;
    const msg = (err?.message || '').toLowerCase();

    if (
      status === 400 ||
      status === 401 ||
      msg.includes('invalid') ||
      msg.includes('credentials')
    ) {
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
    return 'Login failed. Please try again';
  };

  const handleLogin = async () => {
    setTouched({ email: true, password: true });
    if (!validate()) return;

    try {
      await signIn(normalizeEmail(email), normalizePassword(password));
      router.replace('/home');
    } catch (err: unknown) {
      const authErr = err as AuthError;
      const message = mapAuthErrorToMessage(authErr);
      setFormError(message);
    }
  };

  const handleGoToRegister = () => {
    router.push('/auth/registration');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <View style={styles.inner}>
          <Image
            source={require('@/src/assets/images/loginIllustration.png')}
            style={[styles.image, { width: windowWidth * 0.8 }]}
            resizeMode="contain"
          />

          <Text style={styles.title}>Sign in</Text>

          <View style={styles.form}>
            {formError ? (
              <View style={styles.formErrorBanner}>
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            ) : null}

            {/* Email */}
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
                value={email}
                onChangeText={setEmail}
                onBlur={() => handleBlur('email')}
                returnKeyType="next"
              />
            </Input>
            {touched.email && errors.email ? (
              <Text style={styles.errorText}>{errors.email}</Text>
            ) : null}

            {/* Password */}
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
                value={password}
                onChangeText={setPassword}
                onBlur={() => handleBlur('password')}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />
            </Input>
            {touched.password && errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}

            <Button
              title={isLoading ? 'Signing in...' : 'Sign In'}
              variant="primary"
              size="lg"
              onPress={handleLogin}
              disabled={isLoading || !isValid}
              style={styles.button}
            />

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don’t have an account?</Text>
              <TouchableOpacity onPress={handleGoToRegister}>
                <Text style={styles.registerLink}> Sign up</Text>
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
  image: { height: 180, marginBottom: 20 },
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
