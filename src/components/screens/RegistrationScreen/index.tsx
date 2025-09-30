import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
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
  [key: string]: unknown;
}

export default function RegisterScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [touched, setTouched] = useState<{ firstName?: boolean; lastName?: boolean; email?: boolean; password?: boolean; confirmPassword?: boolean }>({});
  const router = useRouter();
  
  // Zustand store
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const windowWidth = Dimensions.get('window').width;

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched({ ...touched, [field]: true });
    validate(); 
  };

  // Clear error when component mounts or when user starts typing
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [firstName, lastName, email, password, confirmPassword, error, clearError]);

  const handleRegister = async () => {
    setTouched({ firstName: true, lastName: true, email: true, password: true, confirmPassword: true });
    if (!validate()) return;

    try {
      await signUp(email, password, firstName, lastName);
      Alert.alert('Success', 'Account created successfully');
      router.replace('/course-code');
    } catch (err: unknown) {
      const authError = err as AuthError;
      Alert.alert('Registration Failed', authError.message || 'Something went wrong');
    }
  };

  const handleGoToLogin = () => {
    router.push('/auth/login');
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

          <Text style={styles.title}>Sign up</Text>

          <View style={styles.form}>
            {/* First Name */}
            <Input
              variant="outline"
              size="xl"
              style={[
                styles.input,
                touched.firstName && errors.firstName && styles.inputError
              ]}
            >
              <InputField
                placeholder="First name"
                autoCapitalize="words"
                value={firstName}
                onChangeText={setFirstName}
                onBlur={() => handleBlur('firstName')}
              />
            </Input>
            {touched.firstName && errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

            {/* Last Name */}
            <Input
              variant="outline"
              size="xl"
              style={[
                styles.input,
                touched.lastName && errors.lastName && styles.inputError
              ]}
            >
              <InputField
                placeholder="Last name"
                autoCapitalize="words"
                value={lastName}
                onChangeText={setLastName}
                onBlur={() => handleBlur('lastName')}
              />
            </Input>
            {touched.lastName && errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

            {/* Email */}
            <Input
              variant="outline"
              size="xl"
              style={[
                styles.input,
                touched.email && errors.email && styles.inputError
              ]}
            >
              <InputField
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                onBlur={() => handleBlur('email')}
              />
            </Input>
            {touched.email && errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            {/* Password */}
            <Input
              variant="outline"
              size="xl"
              style={[
                styles.input,
                touched.password && errors.password && styles.inputError
              ]}
            >
              <InputField
                placeholder="Password"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                onBlur={() => handleBlur('password')}
              />
            </Input>
            {touched.password && errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            {/* Confirm Password */}
            <Input
              variant="outline"
              size="xl"
              style={[
                styles.input,
                touched.confirmPassword && errors.confirmPassword && styles.inputError
              ]}
            >
              <InputField
                placeholder="Confirm Password"
                secureTextEntry
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onBlur={() => handleBlur('confirmPassword')}
              />
            </Input>
            {touched.confirmPassword && errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}

            {/* Button */}
            <Button 
              title={isLoading ? 'Signing up...' : 'Sign Up'} 
              variant="primary" 
              size="lg"
              onPress={handleRegister} 
              disabled={isLoading}
              style={styles.button}
            />

            {/* Registration link */}
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
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  form: { width: '100%', maxWidth: 400 },
  input: {
    marginBottom: 14,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginBottom: 6,
    marginLeft: 4,
  },
  button: {
    marginTop: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    color: '#555',
    fontSize: 14,
  },
  registerLink: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 14,
  },
});
