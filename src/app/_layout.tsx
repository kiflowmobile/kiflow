import 'react-native-reanimated';
import { useAuthStore } from '@/src/stores/authStore';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useRootNavigationState, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useUserProgressStore } from '../stores';
import CustomHeader from '../components/ui/CustomHeader';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../firebase';
import { initAmplitude } from '../amplitude';

export default function RootLayout() {
  const { initFromLocal } = useUserProgressStore();
  const { user, isGuest, isLoading } = useAuthStore();
  const router = useRouter(); 
  const navigationState = useRootNavigationState();
  const isNavigationReady = Boolean(navigationState?.key);

  const [loaded] = useFonts({
    RobotoCondensed: require('../assets/fonts/RobotoCondensed.ttf'),
    Inter: require('../assets/fonts/Inter.ttf'),
  });

  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    initFromLocal();
  }, [user, initFromLocal]);

  const didRedirect = useRef(false);


  const pathname = usePathname();
  
  // useEffect(() => {
  //   if (!loaded || isLoading || !isNavigationReady) return;
  
  //   if (isGuest === true) {
  //     const publicRoutes = ['/', '/auth/login', '/auth/registration'];
  
  //     const isPublic = publicRoutes.includes(pathname);
  
  //     if (!isPublic) {
  //       router.replace('/');
  //     }
  //   }
  // }, [isGuest, isLoading, loaded, isNavigationReady, pathname]);
  


  useEffect(() => {
    initAmplitude();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="course-code" />
          <Stack.Screen name="module/[moduleId]" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/registration" />
          <Stack.Screen name="+not-found" />

          <Stack.Screen
            name="courses/[id]"
            options={{
              headerShown: true,
              header: () => <CustomHeader showBackButton />,
            }}
          />

          <Stack.Screen
            name="statistics/[id]"
            options={{
              headerShown: true,
              header: () => <CustomHeader showBackButton title="Course progress" />,
            }}
          />

          <Stack.Screen name="instractions" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}