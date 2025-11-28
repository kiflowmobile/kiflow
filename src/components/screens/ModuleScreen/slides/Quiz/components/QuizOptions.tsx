import React from 'react';
import { Pressable, Text, View as RNView, StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/Colors';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';

interface Props {
  options: string[];
  selectedAnswer: number | null;
  checked: boolean;
  correctAnswer: number;
  onSelect: (index: number) => void;
}

const QuizOptions: React.FC<Props> = ({
  options,
  selectedAnswer,
  checked,
  correctAnswer,
  onSelect,
}) => {
  return (
    <RNView style={styles.optionsContainer}>
      {options.map((option, index) => {
        const isCorrect = index === correctAnswer;
        const isSelected = index === selectedAnswer;

        let visualStyle = null as any;
        if (checked) {
          visualStyle = isCorrect
            ? styles.optionCorrect
            : isSelected
            ? styles.optionIncorrect
            : null;
        } else {
          visualStyle = isSelected ? styles.optionSelected : null;
        }

        return (
          <Pressable
            key={index}
            style={[styles.option, visualStyle]}
            onPress={() => onSelect(index)}
            disabled={checked}
          >
            <Text style={styles.optionText}>{option}</Text>
          </Pressable>
        );
      })}
    </RNView>
  );
};

const styles = StyleSheet.create({
  optionsContainer: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
  option: {
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  optionSelected: {
    backgroundColor: '#CCD7F1',
    borderColor: '#5774CD',
  },
  optionCorrect: {
    backgroundColor: '#CEF1CA',
    borderColor: '#7CCF00',
  },
  optionIncorrect: {
    backgroundColor: '#FFE1E1',
    borderColor: '#FFA2A2',
  },
  optionText: {
    ...TEXT_VARIANTS.body2,
    color: Colors.black,
    textAlign: 'left',
  },
});

export default QuizOptions;
