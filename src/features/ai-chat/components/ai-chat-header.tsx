import React from 'react';
import { Text, View } from 'react-native';

interface ChatHeaderProps {
  title: string;
}

export const AIChatHeader: React.FC<ChatHeaderProps> = ({ title }) => (
  <View className="flex-row justify-between mb-3">
    <Text className="text-xl font-bold text-slate-900 flex-shrink">{title}</Text>
  </View>
);

