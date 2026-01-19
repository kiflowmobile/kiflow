import { useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

import { SafeAreaView, KeyboardAvoidingView, Button, Input } from '@/shared/ui';
import { useAuth } from '../hooks/useAuth';
import { useAuthForm, authValidators, useAuthRedirect } from '../hooks/useAuthForm';
import { normalizeEmail, mapAuthErrorToMessage } from '../utils/authUtils';
import { useAnalytics } from '@/features/analytics';
import BackIcon from '@/src/assets/images/arrow-left.svg';
import DoneIcon from '@/src/assets/images/done.svg';
import OpenEye from '@/src/assets/images/eye-open.svg';
import ClosedEye from '@/src/assets/images/eye-closed.svg';

type LoginFields = 'email' | 'password';

export function LoginScreen() {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const { user, isGuest, isLoading, error, signIn, clearError } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  useAuthRedirect(user, isGuest);

  const {
    form,
    touched,
    errors,
    formError,
    isValid,
    setField,
    handleBlur,
    validate,
    setFormError,
  } = useAuthForm<LoginFields>({
    fields: ['email', 'password'],
    validators: {
      email: authValidators.email,
      password: authValidators.password,
    },
    onClearAuthError: clearError,
    authError: error,
  });

  useEffect(() => {
    trackEvent('sign_in_screen__load');
  }, [trackEvent]);

  const isEmailValid = useMemo(() => {
    return touched.email && !errors.email && authValidators.email(form.email) === undefined;
  }, [form.email, touched.email, errors.email]);

  const handleLogin = async () => {
    trackEvent('sign_in_screen__submit__click');
    if (!validate()) return;

    try {
      await signIn(normalizeEmail(form.email), form.password);
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
            <Input
              value={form.email}
              onChangeText={(v) => setField('email', v)}
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

            <Input
              value={form.password}
              onChangeText={(v) => setField('password', v)}
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
