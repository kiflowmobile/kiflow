import { useAuthStore } from '@/src/stores/authStore';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Button from '../../ui/button';
import { Input, InputField } from '../../ui/input';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

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
  const user = useAuthStore()

  const [formError, setFormError] = useState<string | null>(null);

  const router = useRouter();

  const { signIn, isLoading, error, clearError } = useAuthStore();


  const normalizeEmail = (value: string) => value.trim().toLowerCase();
  const normalizePassword = (value: string) => value;

  // const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // 🟣 Якщо навігація ще не готова — просто виходимо
    if (!rootNavigationState?.key) return;

    // 🟢 Тільки після того, як навігація готова, перевіряємо користувача
    console.log(user.isGuest)
    if (!user.isGuest ) {
      // 👇 невелика затримка гарантує, що replace виконається після монтування
      setTimeout(() => {
        router.replace('/home');
      }, 0);
    }
  }, [user, rootNavigationState]);
  
 

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

          <Text style={styles.title}>Sign in</Text>

          <View style={styles.form}>
            {formError ? (
              <View style={styles.formErrorBanner}>
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            ) : null}

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
                value={email}
                onChangeText={setEmail}
                onBlur={() => handleBlur('email')}
                returnKeyType="next"
              />
            </Input>

            {/* Password */}
            {touched.password && errors.password ? (
              <View style={styles.formErrorBanner}>
                <Text style={styles.formErrorText}>{errors.password}</Text>
              </View>
            ) : null}
<View style={styles.passwordContainer}>
  <Input
    variant="outline"
    size="xl"
    style={[styles.input, touched.password && errors.password && styles.inputError]}
  >
    <InputField
      placeholder="Password"
      secureTextEntry={!showPassword}
      autoCapitalize="none"
      autoCorrect={false}
      value={password}
      onChangeText={setPassword}
      onBlur={() => handleBlur('password')}
      returnKeyType="go"
      onSubmitEditing={handleLogin}
      style={{ flex: 1 }}
    />
  </Input>

  <TouchableOpacity
    style={styles.eyeButton}
    onPress={() => setShowPassword(!showPassword)}
  >
    {showPassword ? (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" />
        <Path d="M16.681 16.673a8.717 8.717 0 0 1 -4.681 1.327c-3.6 0 -6.6 -2 -9 -6c1.272 -2.12 2.712 -3.678 4.32 -4.674m2.86 -1.146a9.055 9.055 0 0 1 1.82 -.18c3.6 0 6.6 2 9 6c-.666 1.11 -1.379 2.067 -2.138 2.87" />
        <Path d="M3 3l18 18" />
      </Svg>
    ) : (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
        <Path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
      </Svg>
    )}
  </TouchableOpacity>
</View>


            

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
  passwordContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 400,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 14,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 18,
  },
});
