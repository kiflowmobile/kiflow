import React, { useEffect } from 'react';
import { Image, Text as RNText, StyleSheet, View, ImageBackground } from 'react-native';
import { useRootNavigationState, useRouter } from 'expo-router';
import Button from '../../ui/button';
import { useAuthStore } from '@/src/stores';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';

export default function WelcomeScreen() {
  const router = useRouter();
  const user = useAuthStore();
  const { justSignedUp } = useAuthStore();
  const rootNavigationState = useRootNavigationState();
  const analyticsStore = useAnalyticsStore.getState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    if (!user.isGuest && !justSignedUp) {
      setTimeout(() => {
        router.replace('/courses');
      }, 0);
    }
  }, [user, justSignedUp, rootNavigationState]);

  const handleSignIn = () => {
    analyticsStore.trackEvent('start_screen__sign_in__click');

    try {
      router.push('/auth/registration');
    } catch (error) {
      console.error('❌ WelcomeScreen: Error navigating to login:', error);
    }
  };

  const handleSignUp = () => {
    analyticsStore.trackEvent('start_screen__sign_up__click');

    try {
      router.push('/auth/login');
    } catch (error) {
      console.error('❌ WelcomeScreen: Error navigating to registration:', error);
    }
  };

  useEffect(() => {
    analyticsStore.trackEvent('start_screen__load');
  }, []);

  return (
    <ImageBackground
      source={require('@/src/assets/images/welcome-screen.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.contentContainer}>
          <View style={styles.logoSection}>
            <Image
              source={require('@/src/assets/images/kiflow-logo.jpeg')}
              style={styles.logo}
              resizeMode="contain"
            />
            {/* <RNText style={styles.welcomeText}>
              Welcome to Kiflow! <br />
              Your gateway to online education
            </RNText> */}
          </View>

          <View style={styles.buttonSection}>
            <Button
              title="Create Account"
              size="lg"
              onPress={handleSignIn}
              variant="light"
              style={styles.navButton}
            />

            <Button
              title="Log In"
              size="lg"
              variant="outline"
              onPress={handleSignUp}
              style={styles.navButton}
            />
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 380,
  },
  logo: {
    width: 200,
    height: 50,
  },
  welcomeText: {
    ...TEXT_VARIANTS.title1,
    marginTop: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  buttonSection: {
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    width: 343,
  },
});
