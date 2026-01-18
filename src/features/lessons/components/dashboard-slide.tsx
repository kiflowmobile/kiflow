import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useAuthStore } from '@/features/auth';
import { useModulesStore } from '@/features/modules';
import { useMainRatingStore } from '@/features/statistics';
import { SkillsChart } from '@/shared/ui';

interface DashboardSlideProps {
  title: string;
  courseId: string
}

const calculateQuizRating = (quizData: Record<string, { selectedAnswer: number; correctAnswer: number }>) => {
  const entries = Object.values(quizData);
  const total = entries.length;
  if (total === 0) return 0;

  const correct = entries.filter(q => q.selectedAnswer === q.correctAnswer).length;
  const rating = (correct / total) * 5;

  return Number(rating.toFixed(1)); 
};

export const DashboardSlide: React.FC<DashboardSlideProps> = ({ courseId, title }) => {
  const { user } = useAuthStore();
  const currentModuleId = useModulesStore.getState().currentModule?.id;

  const {
    average,
    skills,
    fetchAverage,
    fetchSkills,
  } = useMainRatingStore();
  const [quizRatings, setQuizRatings] = useState<number | null>(null);

  useEffect(() => {
    const loadQuizRatings = async () => {
      try {
        const stored = await AsyncStorage.getItem(`quiz-progress-${courseId}`);
        if (!stored) return;
        const parsed = JSON.parse(stored);

        
  
        const quizScore = calculateQuizRating(parsed);
        setQuizRatings(quizScore);
      } catch (err) {
        console.error('Error loading quiz ratings:', err);
      }
    };
  
    if (courseId) loadQuizRatings();
  }, [courseId]);

  useEffect(() => {
    if (!user || !currentModuleId) return;

    fetchAverage(user.id, currentModuleId);
    fetchSkills(user.id, currentModuleId);
  }, [user, currentModuleId]);

  const combinedAverage = useMemo(() => {
    if (quizRatings !== null && average !== null) {
      const avg = (quizRatings + Number(average.toFixed(1))) / 2;
      return `${avg.toFixed(1)}/5`;
    }
    return '...';
  }, [quizRatings, average]);


  return (
    <View className="flex-1 p-4 items-center justify-center bg-surface">
      <View className="rounded-2xl p-4 bg-surface shadow-md">
        <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
          <View className="self-center bg-purple-100 p-3 rounded-full mb-3">
            <Svg
              width={40}
              height={40}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#7c3aed"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Path d="M10 3.2a9 9 0 1 0 10.8 10.8a1 1 0 0 0 -1 -1h-3.8a4.1 4.1 0 1 1 -5 -5v-4a.9 .9 0 0 0 -1 -.8" />
              <Path d="M15 3.5a9 9 0 0 1 5.5 5.5h-4.5a9 9 0 0 0 -1 -1v-4.5" />
            </Svg>
          </View>

          <Text className="text-xl font-extrabold text-center text-slate-900 mb-1">{title}</Text>
          <Text className="text-base text-center text-slate-600 mb-4">
            Ця сторінка відображає твою персональну статистику
          </Text>

          <View className="bg-gray-50 rounded-xl p-4 mt-3">
            <Text className="text-lg font-semibold text-slate-900 mb-3">Статистика</Text>
            <View className="flex-row justify-between gap-2">
              {average !== null && (
                <View className="flex-1 rounded-xl p-3 items-center bg-green-100">
                  <Text className="text-xs text-slate-600 mb-1">Середній бал</Text>
                  <Text className="text-lg font-bold text-green-700">
                    {average.toFixed(1)} /5
                  </Text>
                </View>
              )}
              <View className="flex-1 rounded-xl p-3 items-center bg-purple-100">
                <Text className="text-xs text-slate-600 mb-1">Модулі quiz</Text>
                <Text className="text-lg font-bold text-purple-700">
                  {quizRatings ? quizRatings + '/5' : '...'}
                </Text>
              </View>
              <View className="flex-1 rounded-xl p-3 items-center bg-blue-100">
                <Text className="text-xs text-slate-600 mb-1">Середній бал</Text>
                <Text className="text-lg font-bold text-blue-700">{combinedAverage}</Text>
              </View>
            </View>
          </View>
          <SkillsChart skills={skills} average={average} />
        </ScrollView>
      </View>
    </View>
  );
};


