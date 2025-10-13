import 'react-native-reanimated'; // ⚡️ цей імпорт має бути найпершим

import { useAuthStore } from '@/src/stores/authStore';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useUserProgressStore } from '../stores';
import CustomHeader from '../components/ui/CustomHeader';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


export default function RootLayout() {
  const { initFromLocal } = useUserProgressStore();
  const { user } = useAuthStore();

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    initFromLocal();
  }, [user]);

  if (!loaded) {
    return null;
  }

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
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="module/[moduleId]" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/registration" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        <Stack.Screen name="courses/index" />
        <Stack.Screen name="courses/[id]" />
        <Stack.Screen name="instractions" />
        <Stack.Screen name="profile" />
      </Stack>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
