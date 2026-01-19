import { useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRootNavigationState, useRouter } from 'expo-router';

import { SafeAreaView, KeyboardAvoidingView, Button, Input } from '@/shared/ui';
import { useAuth } from '../hooks/useAuth';
import { emailRegex, normalizeEmail, mapAuthErrorToMessage } from '../utils/authUtils';
import { useAnalytics } from '@/features/analytics';
import BackIcon from '@/src/assets/images/arrow-left.svg';
import DoneIcon from '@/src/assets/images/done.svg';
import OpenEye from '@/src/assets/images/eye-open.svg';
import ClosedEye from '@/src/assets/images/eye-closed.svg';

export function LoginScreen() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { trackEvent } = useAnalytics();
  const { user, isGuest, isLoading, error, signIn, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [formError, setFormError] = useState<string | null>(null);

  // Redirect authenticated users to courses
  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (user && !isGuest) {
      router.replace('/courses');
    }
  }, [user, isGuest, rootNavigationState, router]);

  // Track screen load
  useEffect(() => {
    trackEvent('sign_in_screen__load');
  }, [trackEvent]);

  // Clear errors when input changes
  useEffect(() => {
    if (formError) setFormError(null);
    if (error) clearError();
  }, [email, password, formError, error, clearError]);

  const validate = (nextEmail = email, nextPassword = password) => {
    const nextErrors: typeof errors = {};

    const normalizedEmail = normalizeEmail(nextEmail);
    if (!normalizedEmail) {
      nextErrors.email = 'Email is required';
    } else if (!emailRegex.test(normalizedEmail)) {
      nextErrors.email = 'Invalid email format';
    }

    if (!nextPassword) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const isValid = useMemo(() => {
    return emailRegex.test(normalizeEmail(email)) && !!password;
  }, [email, password]);

  const isEmailValid = useMemo(() => {
    const normalized = normalizeEmail(email);
    return !!normalized && emailRegex.test(normalized) && touched.email && !errors.email;
  }, [email, touched.email, errors.email]);

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate();
  };

  const handleLogin = async () => {
    trackEvent('sign_in_screen__submit__click');
    setTouched({ email: true, password: true });

    if (!validate()) return;

    try {
      await signIn(normalizeEmail(email), password);
      router.replace('/courses');
    } catch (err) {
      setFormError(mapAuthErrorToMessage(err as Parameters<typeof mapAuthErrorToMessage>[0]));
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light">
      <TouchableOpacity className="self-start mt-4 ml-4" onPress={handleGoBack} hitSlop={8}>
        <BackIcon width={24} height={24} />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior="padding" className="flex-1">
        <View className="mt-28 justify-center items-center p-8">
          <Text className="text-3xl font-bold mb-8">Log in</Text>

          <View className="w-full">
            {/* Email Input */}
            <Input
              value={email}
              onChangeText={setEmail}
              onBlur={() => handleBlur('email')}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              containerStyle={{ marginBottom: 12, width: '100%' }}
              isInvalid={touched.email && !!errors.email}
              errorMessage={touched.email ? errors.email : undefined}
              rightIcon={isEmailValid ? <DoneIcon width={24} height={24} /> : undefined}
            />

            {/* Password Input */}
            <Input
              value={password}
              onChangeText={setPassword}
              onBlur={() => handleBlur('password')}
              placeholder="Password"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              containerStyle={{ marginBottom: 12, width: '100%' }}
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

            {formError && <Text className="text-red-500 text-center mb-4">{formError}</Text>}

            <Button
              title={isLoading ? 'Signing in...' : 'Sign In'}
              variant="dark"
              size="lg"
              onPress={handleLogin}
              disabled={isLoading || !isValid}
              style={{ marginTop: 24 }}
            />

            <View className="items-center mt-4">
              <TouchableOpacity hitSlop={8}>
                <Text className="text-blue-500 font-semibold">Forgot password?</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-center mt-36">
              <Text className="text-black font-semibold">Don't have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/auth/registration')}>
                <Text className="text-blue-500 font-semibold"> Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
