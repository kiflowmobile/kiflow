import React from 'react';
import { View, Text } from 'react-native';
import { Button } from '@/shared/ui';

interface Props {
  checked: boolean;
  selectedAnswer: number | null;
  isAnswerCorrect: boolean;
  onCheck: () => void;
  onNext: () => void;
}

export const QuizControls: React.FC<Props> = ({
  checked,
  selectedAnswer,
  isAnswerCorrect,
  onCheck,
  onNext,
}) => {
  if (!checked) {
    return (
      <View className="self-stretch mt-6">
        <Button
          title="Check"
          variant="dark"
          size="lg"
          onPress={onCheck}
          disabled={selectedAnswer === null}
        />
      </View>
    );
  }

  return (
    <View className="self-stretch items-center gap-3 mt-6">
      <Text
        className={`text-lg font-bold text-center ${isAnswerCorrect ? 'text-green-500' : 'text-black'}`}
      >
        {isAnswerCorrect
          ? "✓ Excellent! That's the right answer!"
          : "☹ Not quite, but you're doing great!"}
      </Text>

      <Button variant="dark" size="lg" title="Next" onPress={onNext} style={{ width: '100%' }} />
    </View>
  );
};

export default QuizControls;
