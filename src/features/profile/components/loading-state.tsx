import { SafeAreaView, Spinner, View } from '@/shared/ui';
import { Text } from 'react-native';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = "Завантаження профілю..." }: LoadingStateProps) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <Spinner size="lg" />
        <Text className="mt-4 text-sm text-gray-400">{message}</Text>
      </View>
    </SafeAreaView>
  );
}
