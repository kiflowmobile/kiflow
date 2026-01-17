import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  question: string;
  subtitle?: string;
}

export const QuizQuestion: React.FC<Props> = ({ question, subtitle }) => {
  return (
    <View className="self-stretch items-center px-2">
      <Text className="text-lg font-bold text-center text-black">{question}</Text>
      {subtitle && <Text className="text-sm text-center text-gray-500 mt-1">{subtitle}</Text>}
    </View>
  );
};

export default QuizQuestion;
