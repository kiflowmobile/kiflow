import 'react-native-reanimated';
import '../../global.css';

import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Header } from '@/shared/components/header';
import { useAppInitialization, useNavigationGuard } from './hooks';

const SCREEN_NAMES = {
  INDEX: 'index',
  COURSE_CODE: 'course-code',
  INSTRUCTIONS: 'instructions',
  MODULE: 'module/[moduleId]',
  AUTH_LOGIN: 'auth/login',
  AUTH_REGISTRATION: 'auth/registration',
  COURSE_DETAIL: 'courses/[id]',
  STATISTICS_DETAIL: 'statistics/[id]',
  NOT_FOUND: '+not-found',
} as const;

export default function RootLayout() {
  const { isReady, isLoading, isGuest } = useAppInitialization();

  useNavigationGuard({ isReady, isLoading, isGuest });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name={SCREEN_NAMES.INDEX} />
          <Stack.Screen name={SCREEN_NAMES.COURSE_CODE} />
          <Stack.Screen name={SCREEN_NAMES.MODULE} />
          <Stack.Screen name={SCREEN_NAMES.AUTH_LOGIN} />
          <Stack.Screen name={SCREEN_NAMES.AUTH_REGISTRATION} />
          <Stack.Screen name={SCREEN_NAMES.NOT_FOUND} />
          <Stack.Screen name={SCREEN_NAMES.INSTRUCTIONS} />

          <Stack.Screen
            name={SCREEN_NAMES.COURSE_DETAIL}
            options={{ headerShown: true, header: () => <Header showBackButton /> }}
          />

          <Stack.Screen
            name={SCREEN_NAMES.STATISTICS_DETAIL}
            options={{
              headerShown: true,
              header: () => <Header showBackButton title="Course progress" />,
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
