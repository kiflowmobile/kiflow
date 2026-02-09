import { Button } from '@/components/ui/button';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Text, View } from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 relative overflow-hidden bg-primary px-4 pb-4">
      <View className="absolute inset-0">
        <Image
          source={require('@/assets/images/welcome-bg.jpg')}
          className="w-full h-full max-h-full max-w-full mx-auto"
          resizeMode="cover"
        />
      </View>

      <View className="flex items-center mt-auto">
        <Image source={require('@/assets/images/logo.jpg')} style={{ width: 200, height: 50 }} />
      </View>

      <Text className="text-white text-title-1 text-center mt-4 mb-6">
        Welcome to Kiflow!{'\n'}Your gateway to online education.
      </Text>

      <View className="flex flex-col gap-3">
        <Button
          size="big"
          onPress={() => router.push('/register')}
          className="bg-white"
          textClassName="text-text"
        >
          Create account
        </Button>

        <Button
          size="big"
          onPress={() => router.push('/login')}
          className="bg-transparent border-2 border-white"
          textClassName="text-white"
        >
          Login
        </Button>
      </View>
    </View>
  );
}
