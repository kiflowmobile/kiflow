import "react-native-reanimated"; // ⚡️ цей імпорт має бути найпершим


import { useAuthStore } from '@/src/stores/authStore';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    // Initialize auth state when app starts
    checkSession();
  }, [checkSession]);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (

    <SafeAreaProvider>
  <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="index" />
    <Stack.Screen name="course-code" />
    <Stack.Screen name="home" />
    
    <Stack.Screen name="courses/index" />
    <Stack.Screen name="courses/[id]" />
    <Stack.Screen name="instractions" />
    <Stack.Screen name="auth/login" />
    <Stack.Screen name="auth/registration" />
    <Stack.Screen name="+not-found" />
  </Stack>
</SafeAreaProvider>
  );
}
