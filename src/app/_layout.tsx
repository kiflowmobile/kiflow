import 'react-native-reanimated';
import { useAuthStore } from '@/src/stores/authStore';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
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

  const [loaded] = useFonts({
    RobotoCondensed: require('../assets/fonts/RobotoCondensed.ttf'),
  });

  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    initFromLocal();
  }, [user, initFromLocal]);

  useEffect(() => {
    if (loaded && !isLoading && isGuest === true) {
      router.replace('/');
    }
  }, [isGuest, isLoading, loaded, router]);

  if (!loaded) {
    return null;
  }

  useEffect(() => {
    initAmplitude();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            header: () => <CustomHeader />,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="course-code" options={{ headerShown: false }} />
          <Stack.Screen name="module/[moduleId]" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/registration" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ headerShown: false }} />
          <Stack.Screen name="courses/[id]" />
          <Stack.Screen name="instractions" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
