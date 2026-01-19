import { useEffect, useState } from 'react';
import { useFonts } from 'expo-font';

import { useAuth } from '@/features/auth';
import { useUserProgress } from '@/features/progress';
import { initFirebase } from '@/shared/lib/firebase';
import { initAmplitude } from '@/shared/lib/amplitude';

export function useAppInitialization() {
  const { initFromLocal } = useUserProgress();
  const { user, isGuest, isLoading, checkSession } = useAuth();
  const [servicesInitialized, setServicesInitialized] = useState(false);
  const [initError, setInitError] = useState<Error | null>(null);

  const [fontsLoaded] = useFonts({
    RobotoCondensed: require('../../assets/fonts/RobotoCondensed.ttf'),
    Inter: require('../../assets/fonts/Inter.ttf'),
  });

  // Initialize auth session
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Initialize external services
  useEffect(() => {
    const initServices = async () => {
      try {
        await Promise.all([initFirebase(), initAmplitude()]);
        setServicesInitialized(true);
      } catch (error) {
        console.error('Failed to initialize services:', error);
        setInitError(error instanceof Error ? error : new Error('Service initialization failed'));
        // Still mark as initialized to allow app to function
        setServicesInitialized(true);
      }
    };

    initServices();
  }, []);

  // Initialize local progress data when user is available
  useEffect(() => {
    if (user) {
      initFromLocal();
    }
  }, [user, initFromLocal]);

  return {
    isReady: fontsLoaded && servicesInitialized,
    isLoading,
    isGuest,
    user,
    initError,
  };
}
