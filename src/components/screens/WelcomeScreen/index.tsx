import { useRootNavigationState, useRouter } from 'expo-router';
import { Image, Text as RNText, StyleSheet, View } from 'react-native';
import Button from '../../ui/button';
import { useEffect } from 'react';
import { useAuthStore } from '@/src/stores';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const user = useAuthStore()
  const rootNavigationState = useRootNavigationState();
  const { justSignedUp} = useAuthStore();
  const analyticsStore = useAnalyticsStore.getState();



  useEffect(() => {
    if (!rootNavigationState?.key) return;
  
    if (!user.isGuest && !justSignedUp) {
      setTimeout(() => {
        router.replace('/home');
      }, 0);
    }
  }, [user, justSignedUp, rootNavigationState]);


  const handleSignIn = () => {
    analyticsStore.trackEvent('start_screen__sign_in__click');

    try {
      router.push('/auth/login');
    } catch (error) {
      console.error('❌ WelcomeScreen: Error navigating to login:', error);
    }
  };

  const handleSignUp = () => {
    analyticsStore.trackEvent('start_screen__sign_up__click');

    try {
      router.push('/auth/registration');
    } catch (error) {
      console.error('❌ WelcomeScreen: Error navigating to registration:', error);
    }
  };


  useEffect(() => {
    analyticsStore.trackEvent('start_screen__load');
  }, []);



  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.logoSection}>
          <Image
            source={require("@/src/assets/images/kiflow-logo.jpeg")}
            style={styles.logo}
            resizeMode="contain"
          />
          <RNText style={styles.welcomeText}>
            Welcome to Kiflow
          </RNText>
          <RNText style={styles.subtitleText}>
            Your gateway to online education
          </RNText>
        </View>
        <View style={styles.buttonSection}>
          <Button 
            title="Sign In" 
            variant="primary" 
            size="lg"
            onPress={handleSignIn}
            style={styles.navButton}
          />

          <Button 
            title="Sign Up" 
            variant="secondary" 
            size="lg"
            onPress={handleSignUp}
            style={styles.navButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 300,
    height: 120,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '400',
  },
  buttonSection: {
    width: '100%',
    alignItems: 'center',
    gap: 24,
    marginTop: 128,
  },
  navButton: {
    width: '80%',
  },
});
