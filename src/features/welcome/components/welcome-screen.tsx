import React, { useEffect } from 'react';
import { ImageBackground, View, Image } from 'react-native';
import { useRootNavigationState, useRouter } from 'expo-router';

import { Button } from '@/shared/ui';
import { useAuth } from '@/features/auth';
import { useAnalytics } from '@/features/analytics';

export function WelcomeScreen() {
  const router = useRouter();
  const { isGuest, justSignedUp } = useAuth();
  const rootNavigationState = useRootNavigationState();
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    if (!isGuest && !justSignedUp) {
      setTimeout(() => {
        router.replace('/courses');
      }, 0);
    }
  }, [isGuest, justSignedUp, rootNavigationState, router]);

  useEffect(() => {
    trackEvent('start_screen__load');
  }, [trackEvent]);

  const handleCreateAccount = () => {
    trackEvent('start_screen__sign_up__click');
    router.push('/auth/registration');
  };

  const handleLogIn = () => {
    trackEvent('start_screen__sign_in__click');
    router.push('/auth/login');
  };

  return (
    <ImageBackground
      source={require('@/src/assets/images/welcome-screen.png')}
      className="flex-1 absolute inset-0 [&>div]:!w-full [&>div]:!h-full"
      resizeMode="cover"
    >
      <View className="flex-1 justify-center items-center px-4">
        <View className="items-center mt-96">
          <Image
            source={require('@/src/assets/images/kiflow-logo.jpeg')}
            className="!w-[200px] !h-[50px]"
            resizeMode="contain"
          />
        </View>

        <View className="mt-6 w-full items-center gap-3">
          <Button
            title="Create Account"
            size="lg"
            onPress={handleCreateAccount}
            variant="light"
            style={{ width: 343 }}
          />

          <Button
            title="Log In"
            size="lg"
            variant="outline"
            onPress={handleLogIn}
            style={{ width: 343 }}
          />
        </View>
      </View>
    </ImageBackground>
  );
}
