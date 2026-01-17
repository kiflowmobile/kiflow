import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ScrollView } from '@/shared/ui';
import { useAnalytics } from '@/features/analytics';
import { QuizBadge } from './quiz-badge';
import { QuizQuestion } from './quiz-question';
import { QuizOptions } from './quiz-options';
import { QuizControls } from './quiz-controls';

interface QuizData {
  question: string;
  options: string[];
  correctAnswer: number;
}

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

export const QuizSlide: React.FC<QuizProps> = ({
  id,
  title,
  subtitle,
  quiz,
  courseId,
  setScrollEnabled,
  isActive,
  onComplete,
}) => {
  const { trackEvent } = useAnalytics();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const STORAGE_KEY = `course-progress-${courseId}`;

  // Load saved progress
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed[id]?.selectedAnswer !== undefined) {
          setSelectedAnswer(parsed[id].selectedAnswer);
          if (parsed[id].checked) setChecked(true);
        }
      }
    });
  }, [STORAGE_KEY, id]);

  // Control scroll
  useEffect(() => {
    if (!setScrollEnabled || !isActive) return;
    setScrollEnabled(checked);
    return () => setScrollEnabled(true);
  }, [setScrollEnabled, checked, isActive]);

  const handleSelect = (index: number) => {
    if (checked) return;
    setSelectedAnswer(index);
    trackEvent('course_screen__vote__click', { id, index });
  };

  const handleCheck = async () => {
    if (selectedAnswer === null) return;
    setChecked(true);

    trackEvent('course_screen__vote__check', {
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
    trackEvent('course_screen__vote__next', {
      id,
      selected: selectedAnswer,
      correct: quiz.correctAnswer,
      correctResult: selectedAnswer === quiz.correctAnswer,
    });

    if (setScrollEnabled) setScrollEnabled(true);
    onComplete?.();
  };

  const isAnswerCorrect = checked && selectedAnswer === quiz.correctAnswer;

  return (
    <View className="flex-1 bg-background-light px-4">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingVertical: 24,
          justifyContent: 'space-between',
        }}
      >
        <View className="items-center gap-6">
          <QuizBadge title={title} />
          <QuizQuestion question={quiz.question} subtitle={subtitle} />
          <QuizOptions
            options={quiz.options}
            selectedAnswer={selectedAnswer}
            checked={checked}
            correctAnswer={quiz.correctAnswer}
            onSelect={handleSelect}
          />
        </View>

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
