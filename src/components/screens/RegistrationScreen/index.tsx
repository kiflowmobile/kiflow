import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'expo-router';
import { useEffect, useMemo,  useState } from 'react';
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
const onlyLettersRegex = /^[\p{L}\p{M}' -]{2,}$/u;

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [touched, setTouched] = useState<{
    firstName?: boolean;
    lastName?: boolean;
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
  }>({});

  const [formError, setFormError] = useState<string | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const router = useRouter();
  const { signUp, isLoading, error, clearError, checkEmailExists } = useAuthStore();
  const windowWidth = Dimensions.get('window').width;

  const normalizeEmail = (v: string) => v.trim().toLowerCase();
  const normalizeName = (v: string) => v.trim().replace(/\s+/g, ' ');

  const validate = (next = { firstName, lastName, email, password, confirmPassword }) => {
    const nextErrors: typeof errors = {};

    const f = normalizeName(next.firstName);
    if (!f) nextErrors.firstName = 'First name is required';
    else if (!onlyLettersRegex.test(f)) nextErrors.firstName = 'Only letters, min 2 chars';

    const l = normalizeName(next.lastName);
    if (!l) nextErrors.lastName = 'Last name is required';
    else if (!onlyLettersRegex.test(l)) nextErrors.lastName = 'Only letters, min 2 chars';

    const e = normalizeEmail(next.email);
    if (!e) nextErrors.email = 'Email is required';
    else if (!emailRegex.test(e)) nextErrors.email = 'Invalid email format';

    const p = next.password;
    const cp = next.confirmPassword;

    if (!p) nextErrors.password = 'Password is required';
    if (!cp) nextErrors.confirmPassword = 'Please confirm your password';
    else if (p !== cp) nextErrors.confirmPassword = 'Passwords do not match';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const isValid = useMemo(() => {
    return (
      onlyLettersRegex.test(normalizeName(firstName)) &&
      onlyLettersRegex.test(normalizeName(lastName)) &&
      emailRegex.test(normalizeEmail(email)) &&
      !!password &&
      confirmPassword === password &&
      !errors.email
    );
  }, [firstName, lastName, email, password, confirmPassword, errors.email]);

  const handleBlur = async (field: keyof typeof touched) => {
    setTouched((t) => ({ ...t, [field]: true }));

    if (
      field === 'email' &&
      checkEmailExists &&
      emailRegex.test(normalizeEmail(email))
    ) {
      const e = normalizeEmail(email);
      try {
        setCheckingEmail(true);
        const exists = await checkEmailExists(e);
        setErrors((prev) => ({
          ...prev,
          email: exists ? 'Email is already registered' : undefined,
        }));
      } catch {
      } finally {
        setCheckingEmail(false);
      }
    }
  };

  useEffect(() => {
    if (formError) setFormError(null);
  }, [firstName, lastName, email, password, confirmPassword]);

  useEffect(() => {
    if (error) clearError();
  }, [error, clearError]);
  const mapAuthErrorToMessage = (err: AuthError): string => {
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
    if (!validate()) return;

    try {
      await signUp(
        normalizeEmail(email),
        password,
        normalizeName(firstName),
        normalizeName(lastName),
      );
      router.replace('/course-code');
    } catch (err: unknown) {
      const message = mapAuthErrorToMessage(err as AuthError);
      setFormError(message);
    }
  };

  const handleGoToLogin = () => router.push('/auth/login');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <View style={styles.inner}>
          <Image
            source={require('@/src/assets/images/loginIllustration.png')}
            style={[styles.image, { width: windowWidth * 0.8 }]}
            resizeMode="contain"
          />
          <Text style={styles.title}>Sign up</Text>

          <View style={styles.form}>
            {formError ? (
              <View style={styles.formErrorBanner}>
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            ) : null}

            {/* First Name */}
            <Input
              variant="outline"
              size="xl"
              style={[styles.input, touched.firstName && errors.firstName && styles.inputError]}
            >
              <InputField
                placeholder="First name"
                autoCapitalize="words"
                value={firstName}
                onChangeText={setFirstName}
                onBlur={() => handleBlur('firstName')}
                returnKeyType="next"
              />
            </Input>
            {touched.firstName && errors.firstName ? (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            ) : null}

            {/* Last Name */}
            <Input
              variant="outline"
              size="xl"
              style={[styles.input, touched.lastName && errors.lastName && styles.inputError]}
            >
              <InputField
                placeholder="Last name"
                autoCapitalize="words"
                value={lastName}
                onChangeText={setLastName}
                onBlur={() => handleBlur('lastName')}
                returnKeyType="next"
              />
            </Input>
            {touched.lastName && errors.lastName ? (
              <Text style={styles.errorText}>{errors.lastName}</Text>
            ) : null}

            {/* Email */}
            <Input
              variant="outline"
              size="xl"
              style={[styles.input, touched.email && errors.email && styles.inputError]}
            >
              <InputField
                placeholder={checkingEmail ? 'Checking email…' : 'Email'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
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
                returnKeyType="next"
              />
            </Input>
            {touched.password && errors.password ? (
              <Text style={styles.errorText}>{errors.password}</Text>
            ) : null}

            {/* Confirm Password */}
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
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onBlur={() => handleBlur('confirmPassword')}
                returnKeyType="go"
                onSubmitEditing={handleRegister}
              />
            </Input>
            {touched.confirmPassword && errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}

            <Button
              title={isLoading ? 'Signing up…' : 'Sign Up'}
              variant="primary"
              size="lg"
              onPress={handleRegister}
              disabled={isLoading || !isValid}
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
