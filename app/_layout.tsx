import 'react-native-reanimated';

import '@/global.css';

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/store/auth-store';
import { PortraitModeGuard } from '@/components/ui/portrait-mode-guard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { initialize } = useAuthStore();

  const [fontsLoaded] = useFonts({
    RobotoCondensed: require('../assets/fonts/RobotoCondensed.ttf'),
    Inter: require('../assets/fonts/Inter.ttf'),
  });

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="reset-password" />
          <Stack.Screen name="email-verification" />
          <Stack.Screen name="company-code" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="change-password" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <PortraitModeGuard />
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
