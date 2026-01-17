import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  title: string;
}

export const QuizBadge: React.FC<Props> = ({ title }) => {
  return (
    <View className="items-center self-stretch">
      <View className="px-4 py-2 rounded-full bg-[#FFD988] flex-row items-center gap-2">
        <Text className="text-sm font-bold text-black">{title}</Text>
      </View>
    </View>
  );
};

export default QuizBadge;
