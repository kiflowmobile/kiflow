import React from 'react';
import { Text, View } from 'react-native';

interface MediaPlaceholderProps {
  message?: string;
}

export const MediaPlaceholder: React.FC<MediaPlaceholderProps> = ({
  message = 'Відео ще недоступне',
}) => {
  return (
    <View className="flex-1 bg-surface p-4.5 justify-center">
      <View className="h-[260px] w-full rounded-lg border border-dashed border-gray-300 items-center justify-center bg-gray-100">
        <Text className="text-lg text-gray-400">{message}</Text>
      </View>
    </View>
  );
};
