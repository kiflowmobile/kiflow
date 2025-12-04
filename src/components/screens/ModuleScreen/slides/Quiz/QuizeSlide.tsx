import { View } from '@/src/components/ui/view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ScrollView, View as RNView, StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/Colors';
import QuizBadge from './components/QuizBadge';
import QuizQuestion from './components/QuizQuestion';
import QuizOptions from './components/QuizOptions';
import QuizControls from './components/QuizControls';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';

type QuizData = {
  question: string;
  options: string[];
  correctAnswer: number;
};

interface QuizProps {
  id: string;
  courseId: string;
  title: string;
  subtitle?: string;
  quiz: QuizData;
  setScrollEnabled?: (enabled: boolean) => void;
  isActive?: boolean;
  onComplete?: () => void;
}

const QuizSlide: React.FC<QuizProps> = ({
  id,
  title,
  subtitle,
  quiz,
  courseId,
  setScrollEnabled,
  isActive,
  onComplete,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const analyticsStore = useAnalyticsStore.getState();

  const STORAGE_KEY = `course-progress-${courseId}`;

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed[id]?.selectedAnswer !== undefined) {
            setSelectedAnswer(parsed[id].selectedAnswer);
            if (parsed[id].checked) setChecked(true);
          }
        }
      } catch (err) {
        console.error('Error loading quiz progress:', err);
      }
    };
    loadProgress();
  }, [STORAGE_KEY, id]);

  useEffect(() => {
    if (!setScrollEnabled || !isActive) return;
    setScrollEnabled(checked);
    return () => {
      setScrollEnabled(true);
    };
  }, [setScrollEnabled, checked, isActive]);

  const handleSelect = (index: number) => {
    if (checked) return;
    setSelectedAnswer(index);

    analyticsStore.trackEvent('course_screen__vote__click', {
      id,
      index,
    });
  };

  const handleCheck = async () => {
    if (selectedAnswer === null) return;
    setChecked(true);

    analyticsStore.trackEvent('course_screen__vote__check', {
      id,
      selected: selectedAnswer,
      correct: quiz.correctAnswer,
    });

    try {
      const existing = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = existing ? JSON.parse(existing) : {};

      parsed[id] = {
        selectedAnswer,
        correctAnswer: quiz.correctAnswer,
        checked: true,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch (err) {
      console.error('Error saving quiz progress:', err);
    }
  };

  const handleNext = () => {
    analyticsStore.trackEvent('course_screen__vote__next', {
      id,
      selected: selectedAnswer,
      correct: quiz.correctAnswer,
      correctResult: selectedAnswer === quiz.correctAnswer,
    });

    // make sure scrolling is enabled before moving on
    if (setScrollEnabled) setScrollEnabled(true);

    if (typeof onComplete === 'function') onComplete();
  };

  const isAnswerCorrect = checked && selectedAnswer === quiz.correctAnswer;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <RNView style={styles.content}>
          <QuizBadge title={title} />
          <QuizQuestion question={quiz.question} subtitle={subtitle} />
          <QuizOptions
            options={quiz.options}
            selectedAnswer={selectedAnswer}
            checked={checked}
            correctAnswer={quiz.correctAnswer}
            onSelect={handleSelect}
          />
        </RNView>

        <QuizControls
          checked={checked}
          selectedAnswer={selectedAnswer}
          isAnswerCorrect={isAnswerCorrect}
          onCheck={handleCheck}
          onNext={handleNext}
        />
      </ScrollView>
    </View>
  );
};

export default QuizSlide;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    gap: 24,
  },
});
