import React from 'react';
import { View as RNView, Text, StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/Colors';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';

interface Props {
  question: string;
  subtitle?: string;
}

const QuizQuestion: React.FC<Props> = ({ question, subtitle }) => {
  return (
    <RNView style={styles.questionWrapper}>
      <Text style={styles.question}>{question}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </RNView>
  );
};

const styles = StyleSheet.create({
  questionWrapper: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  question: {
    ...TEXT_VARIANTS.title2,
    textAlign: 'center',
    color: Colors.black,
  },
  subtitle: {
    ...TEXT_VARIANTS.body2,
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 4,
  },
});

export default QuizQuestion;
