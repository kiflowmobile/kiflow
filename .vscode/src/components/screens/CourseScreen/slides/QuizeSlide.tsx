import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { CheckCircle, XCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet } from 'react-native';


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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const QuizSlide: React.FC<QuizProps> = ({ title, subtitle, quiz }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const getOptionStyle = (index: number) => {
    if (selectedAnswer === null) return styles.option;

    if (index === quiz.correctAnswer)
      return StyleSheet.flatten([styles.option, styles.optionCorrect]);

    if (index === selectedAnswer && selectedAnswer !== quiz.correctAnswer)
      return StyleSheet.flatten([styles.option, styles.optionIncorrect]);

    return styles.option;
  };

  const getOptionIcon = (index: number) => {
    if (selectedAnswer === null) return null;

    if (index === quiz.correctAnswer) {
      return <CheckCircle size={20} color="#22c55e" />;
    }

    if (index === selectedAnswer && selectedAnswer !== quiz.correctAnswer) {
      return <XCircle size={20} color="#ef4444" />;
    }

    return null;
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.question}>{quiz.question}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {quiz.options.map((option, index) => (
            <Pressable
              key={index}
              style={getOptionStyle(index)}
              onPress={() => setSelectedAnswer(index)}
              disabled={selectedAnswer !== null}
            >
              <View style={styles.optionContent}>
                {getOptionIcon(index)}
                <Text>
                  {option}
                </Text>
              </View>
            </Pressable>
          ))}
        </View> 

        {selectedAnswer !== null && (
          <View style={styles.feedbackContainer}>
            <Text >
              {selectedAnswer === quiz.correctAnswer
                ? 'Правильно!'
                : 'Неправильно. Спробуйте ще раз!'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default QuizSlide;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f7fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
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
    backgroundColor: '#e0f2fe',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    width: SCREEN_WIDTH - 32,
    maxWidth: 760,
  },
  question: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111',
  },
  optionsContainer: {
    width: '100%',
    maxWidth: 760,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    marginBottom: 12,
    alignItems: 'center',
  },
  optionCorrect: {
    backgroundColor: 'rgba(34,197,94,0.3)',
    borderColor: '#22c55e',
  },
  optionIncorrect: {
    backgroundColor: 'rgba(239,68,68,0.3)',
    borderColor: '#ef4444',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#111',
    textAlign: 'center',
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
});
