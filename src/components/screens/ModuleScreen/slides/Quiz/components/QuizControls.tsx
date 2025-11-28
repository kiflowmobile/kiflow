import React from 'react';
import { View as RNView, Text, StyleSheet } from 'react-native';
import Button from '@/src/components/ui/button';
import { Colors } from '@/src/constants/Colors';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';

interface Props {
  checked: boolean;
  selectedAnswer: number | null;
  isAnswerCorrect: boolean;
  onCheck: () => void;
  onNext: () => void;
}

const QuizControls: React.FC<Props> = ({
  checked,
  selectedAnswer,
  isAnswerCorrect,
  onCheck,
  onNext,
}) => {
  return (
    <RNView style={styles.bottomControls}>
      {!checked ? (
        <Button
          title="Check"
          variant="dark"
          size="lg"
          onPress={onCheck}
          disabled={selectedAnswer === null}
        />
      ) : (
        <RNView style={styles.feedbackContainer}>
          <Text style={isAnswerCorrect ? styles.feedbackTextCorrect : styles.feedbackTextIncorrect}>
            {isAnswerCorrect
              ? "✓ Excellent! That's the right answer!"
              : "☹ Not quite, but you're doing great!"}
          </Text>

          <Button
            variant="dark"
            size="lg"
            title="Next"
            onPress={onNext}
            style={styles.nextButton}
          />
        </RNView>
      )}
    </RNView>
  );
};

const styles = StyleSheet.create({
  bottomControls: {
    alignSelf: 'stretch',
    marginTop: 24,
  },
  feedbackContainer: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 12,
  },
  feedbackTextCorrect: {
    ...TEXT_VARIANTS.title2,
    color: Colors.green,
    textAlign: 'center',
  },
  feedbackTextIncorrect: {
    ...TEXT_VARIANTS.title2,
    color: Colors.black,
    textAlign: 'center',
  },
  nextButton: {
    alignSelf: 'stretch',
    width: '100%',
  },
});

export default QuizControls;
