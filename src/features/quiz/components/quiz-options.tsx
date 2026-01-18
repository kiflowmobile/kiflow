import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface Props {
  options: string[];
  selectedAnswer: number | null;
  checked: boolean;
  correctAnswer: number;
  onSelect: (index: number) => void;
}

export const QuizOptions: React.FC<Props> = ({
  options,
  selectedAnswer,
  checked,
  correctAnswer,
  onSelect,
}) => {
  const getOptionStyle = (index: number) => {
    const isCorrect = index === correctAnswer;
    const isSelected = index === selectedAnswer;

    if (checked) {
      if (isCorrect) return 'bg-green-100 border-green-400';
      if (isSelected) return 'bg-red-100 border-red-300';
    } else if (isSelected) {
      return 'bg-blue-100 border-blue-400';
    }

    return 'bg-white border-gray-200';
  };

  return (
    <View className="self-stretch mt-2">
      {options.map((option, index) => (
        <Pressable
          key={index}
          className={`py-5 px-4 rounded-lg mb-3 items-start justify-center border ${getOptionStyle(index)}`}
          onPress={() => onSelect(index)}
          disabled={checked}
        >
          <Text className="text-sm text-black text-left">{option}</Text>
        </Pressable>
      ))}
    </View>
  );
};
