import { useAuthStore } from '@/src/stores/authStore';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../ui/button';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import Input from '../../ui/input';
import { Colors } from '@/src/constants/Colors';
import BackIcon from '@/src/assets/images/arrow-left.svg';
import DoneIcon from '@/src/assets/images/done.svg';
import OpenEye from '@/src/assets/images/eye-open.svg';
import ClosedEye from '@/src/assets/images/eye-closed.svg';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';

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
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const user = useAuthStore((state) => state.user);
  const analyticsStore = useAnalyticsStore.getState();

  const [formError, setFormError] = useState<string | null>(null);

  const router = useRouter();

  const signIn = useAuthStore((state) => state.signIn);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const normalizeEmail = (value: string) => value.trim().toLowerCase();
  const normalizePassword = (value: string) => value;

  const rootNavigationState = useRootNavigationState();

  const isGuest = useAuthStore((state) => state.isGuest);

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (user && !isGuest) {
      setTimeout(() => {
        router.replace('/courses');
      }, 0);
    }
  }, [user, isGuest, rootNavigationState, router]);

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
    analyticsStore.trackEvent('sign_in_screen__submit__click');

    setTouched({ email: true, password: true });
    if (!validate()) return;

    try {
      await signIn(normalizeEmail(email), normalizePassword(password));
      router.replace('/courses');
    } catch (err: unknown) {
      const authErr = err as AuthError;
      const message = mapAuthErrorToMessage(authErr);
      setFormError(message);
    }
  };

  const handleGoToRegister = () => {
    router.push('/auth/registration');
  };

  const handleGoBack = () => {
    try {
      // expo-router silently ignores back() if there is no history entry
      router.back();
    } catch {
      router.push('/');
    }
  };

  const isEmailValid = useMemo(() => {
    const e = normalizeEmail(email);
    // email введён, формат ок, поле уже трогали и нет ошибки
    return !!e && emailRegex.test(e) && touched.email && !errors.email;
  }, [email, touched.email, errors.email]);


  useEffect(() => {
    analyticsStore.trackEvent('sign_in_screen__load');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack} hitSlop={8}>
        <BackIcon width={24} height={24} />
      </TouchableOpacity>
      <KeyboardAvoidingView behavior="padding" style={styles.keyboardContainer}>
        <View style={styles.inner}>
          <Text style={styles.title}>Log in</Text>

          <View style={styles.form}>
            {/* Email */}
            <Input
              value={email}
              onChangeText={(value) => {
                setEmail(value);
              }}
              onBlur={() => handleBlur('email')}
              renderCustomPlaceholder={() => (
                <Text
                  style={{
                    ...TEXT_VARIANTS.placeholder,
                    color: '#a1a1a1',
                  }}
                >
                  Email
                </Text>
              )}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              containerStyle={styles.input}
              isInvalid={touched.email && !!errors.email}
              errorMessage={touched.email ? errors.email : undefined}
              rightIcon={
                isEmailValid ? (
                  <DoneIcon width={24} height={24} />
                ) : undefined
              }
            />

            {/* Password */}
            <Input
              value={password}
              onChangeText={setPassword}
              onBlur={() => handleBlur('password')}
              renderCustomPlaceholder={() => (
                <Text
                  style={{
                    ...TEXT_VARIANTS.placeholder,
                    color: '#a1a1a1',
                  }}
                >
                  Password
                </Text>
              )}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
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

            <Button
              title={isLoading ? 'Signing in...' : 'Sign In'}
              variant="dark"
              size="lg"
              onPress={handleLogin}
              disabled={isLoading || !isValid}
              style={styles.button}
            />
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity hitSlop={8}>
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
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
  container: { flex: 1, backgroundColor: Colors.bg },
  keyboardContainer: { flex: 1 },
  backButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    marginLeft: 16,
  },
  inner: { marginTop: 112, justifyContent: 'center', alignItems: 'center', padding: 32 },
  title: { marginBottom: 32, ...TEXT_VARIANTS.largeTitle },
  form: { width: '100%' },
  input: { marginBottom: 12, width: '100%',  },
  button: { marginTop: 24 },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 16,
  },

  forgotPasswordText: {
    color: Colors.blue,
    ...TEXT_VARIANTS.title3,
  },

  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 140,
  },

  registerText: { color: Colors.black, ...TEXT_VARIANTS.title3 },
  registerLink: { color: Colors.blue, ...TEXT_VARIANTS.title3 },
});
