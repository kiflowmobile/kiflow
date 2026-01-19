import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { ProgressBar } from '@/shared/ui';
import { formatBubbleScore } from '../utils';
import type { Criteria, RatingItem } from '../types';

interface CourseStatisticsCardProps {
  course: {
    id: string;
    title: string;
    image: string | null;
  };
  courseAverage: number;
  quizScore: number | undefined;
  progress: number;
  modulesCount: number;
  completedModulesCount: number;
  criteria: Criteria[];
  ratings: RatingItem[];
  isLoading: boolean;
  onPress: () => void;
}

export function CourseStatisticsCard({
  course,
  courseAverage,
  quizScore,
  progress,
  modulesCount,
  completedModulesCount,
  criteria,
  ratings,
  isLoading,
  onPress,
}: CourseStatisticsCardProps) {
  return (
    <Pressable className="mb-4 p-4 rounded-xl bg-white shadow-md" onPress={onPress}>
      <View className="flex-row gap-3 items-start">
        <Image
          source={{ uri: course.image || 'https://picsum.photos/400/300' }}
          className="w-[84px] h-[84px] rounded-xl bg-gray-100"
        />

        <View className="flex-1">
          {/* Header Row */}
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold mb-2 flex-1">Course "{course.title}"</Text>

            {/* Score Bubble */}
            <View className="items-center ml-2">
              <View className="w-10 h-10 relative">
                <Image
                  source={require('@/src/assets/images/score-bubble-shape.png')}
                  className="w-10 h-10"
                  resizeMode="contain"
                />
                <View className="absolute inset-0 items-center justify-center">
                  <Text className="text-base font-bold">
                    {formatBubbleScore(isLoading, courseAverage, quizScore)}
                  </Text>
                </View>
              </View>
              <Text className="text-sm text-gray-500 mt-1">Score</Text>
            </View>
          </View>

          {/* Modules Count */}
          <Text className="text-sm text-gray-500 my-1.5">
            {`${completedModulesCount}/${modulesCount} modules`}
          </Text>

          {/* Progress Bar */}
          <View className="flex-row items-center gap-2 mb-2">
            <ProgressBar percent={progress} height={8} />
          </View>

          {/* Skills Section */}
          <View className="mt-2 pt-3 border-t border-gray-100">
            <Text className="text-base font-bold mb-2">Skills level</Text>

            {criteria.slice(0, 4).map((item) => {
              const skill = ratings.find((s) => s.criteria_id === item.id);
              const score = Math.round(skill?.rating ?? 0);

              return (
                <View key={item.id} className="flex-row items-center justify-between mb-2">
                  <Text className="flex-1 text-sm text-gray-900 mr-3" numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View className="flex-row gap-1.5 mr-2">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <View
                          key={idx}
                          className={`w-[22px] h-2 rounded-md ${
                            idx < score ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </View>
                    <Text className="text-sm font-bold text-gray-900">{`${skill?.rating ?? 0}/5`}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
