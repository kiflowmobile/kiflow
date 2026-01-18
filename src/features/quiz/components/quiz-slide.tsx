import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useAnalytics } from '@/features/analytics';

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
}

export const QuizSlide: React.FC<QuizProps> = ({ id, title, subtitle, quiz, courseId }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const isAnswered = selectedAnswer !== null;
  const { trackEvent } = useAnalytics();


  const STORAGE_KEY = `quiz-progress-${courseId}`;

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const data = await AsyncStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed[id]?.selectedAnswer !== undefined) {
            setSelectedAnswer(parsed[id].selectedAnswer);
          }
        }
      } catch (err) {
        console.error('Error loading quiz progress:', err);
      }
    };
    loadProgress();
  }, []);

  const handleSelect = async (index: number) => {
    setSelectedAnswer(index);

    trackEvent('course_screen__vote__click', {
      id,
      index,
    });

    try {
      const existing = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = existing ? JSON.parse(existing) : {};

      parsed[id] = {
        selectedAnswer: index,
        correctAnswer: quiz.correctAnswer,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch (err) {
      console.error('Error saving quiz progress:', err);
    }
  };


  return (
    <View className="flex-1 bg-surface px-4 justify-center items-center">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 24,
          gap: 16,
        }}
      >
        <View className="items-center self-stretch">
          <Text className="text-xl font-bold text-black text-center">{title}</Text>
          {subtitle ? (
            <Text className="text-base text-gray-500 text-center mt-1">{subtitle}</Text>
          ) : null}
        </View>

        <View className="self-stretch max-w-[760px] bg-black/5 rounded-xl p-4">
          <Text className="text-lg font-medium text-center text-black">{quiz.question}</Text>
        </View>

        <View className="self-stretch max-w-[760px]">
          {quiz.options.map((option, index) => {
            const isCorrect = index === quiz.correctAnswer;
            const isSelected = index === selectedAnswer;

            const visualClass = isAnswered
              ? isCorrect
                ? 'bg-green-500/30 border-green-500'
                : isSelected
                  ? 'bg-red-500/30 border-red-500'
                  : ''
              : '';

            return (
              <Pressable
                key={index}
                className={`py-3.5 px-3 rounded-xl bg-surface mb-3 items-center border border-gray-300 ${visualClass}`}
                onPress={() => handleSelect(index)}
                disabled={isAnswered}
              >
                <Text className="text-base text-black text-center">{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

