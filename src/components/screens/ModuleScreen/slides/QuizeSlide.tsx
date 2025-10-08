import { View } from '@/src/components/ui/view';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

type QuizData = {
  question: string;
  options: string[];
  correctAnswer: number;
};

interface QuizProps {
  title: string;
  subtitle?: string;
  quiz: QuizData;
}

const QuizSlide: React.FC<QuizProps> = ({ title, subtitle, quiz }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const isAnswered = selectedAnswer !== null;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.question}>{quiz.question}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {quiz.options.map((option, index) => {
            const isCorrect = index === quiz.correctAnswer;
            const isSelected = index === selectedAnswer;

            const visualStyle = isAnswered
              ? isCorrect
                ? styles.optionCorrect
                : isSelected
                ? styles.optionIncorrect
                : null
              : null;

            return (
              <Pressable
                key={index}
                style={[styles.option, visualStyle]}
                onPress={() => setSelectedAnswer(index)}
                disabled={isAnswered}
              >
                <Text style={styles.optionText}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

export default QuizSlide;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 16,
  },
  header: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 4,
  },
  questionContainer: {
    alignSelf: 'stretch',
    maxWidth: 760,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    padding: 16,
  },
  question: {
    fontSize: 20,
    fontWeight: '500',
    textAlign: 'center',
    color: '#111',
  },
  optionsContainer: {
    alignSelf: 'stretch',
    maxWidth: 760,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 0.5,
  },
  optionCorrect: {
    backgroundColor: 'rgba(34,197,94,0.3)', 
    borderColor: '#22c55e',
  },
  optionIncorrect: {
    backgroundColor: 'rgba(239,68,68,0.3)',
    borderColor: '#ef4444',
  },
  optionText: {
    fontSize: 16,
    color: '#111',
    textAlign: 'center',
  },
});
