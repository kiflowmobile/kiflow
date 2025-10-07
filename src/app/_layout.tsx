import 'react-native-reanimated';
import { useAuthStore } from '@/src/stores/authStore';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import CustomHeader from '../components/ui/CustomHeader';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const checkSession = useAuthStore((s) => s.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          header: () => <CustomHeader />,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="course-code" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/registration" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        <Stack.Screen name="module/[id]" options={{ headerShown: false }} />

        <Stack.Screen name="courses/index" />
        <Stack.Screen name="courses/[id]" />
        <Stack.Screen name="instractions" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="statistics/index" />
        <Stack.Screen name="statistics/[id]" />
      </Stack>
    </SafeAreaProvider>
  );
}
