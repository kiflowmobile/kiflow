import React from 'react';
import { View, Text } from 'react-native';

interface ProgressBarProps {
  percent: number; // 0..100
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ percent, height = 8 }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <View className="w-full flex-row items-center gap-3 mb-1">
      <View className="flex-1 bg-gray-200 rounded-full overflow-hidden" style={{ height }}>
        <View className="h-full bg-success" style={{ width: `${clamped}%` }} />
      </View>

      <Text className="text-sm font-secondary font-normal text-black">{clamped}%</Text>
    </View>
  );
};
