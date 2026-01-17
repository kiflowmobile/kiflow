import React from 'react';
import { View, Text, Image } from 'react-native';
import { computeCourseAvgNum, formatBubbleScore } from '@/features/statistics/utils';

interface Props {
  isLoading: boolean;
  courseAverage: number | null;
  quizAverage: number | null;
  courseTitle?: string | null;
}

export const StatisticsHeader: React.FC<Props> = ({
  isLoading,
  courseAverage,
  quizAverage,
  courseTitle,
}) => {
  const courseAvgNum = computeCourseAvgNum(courseAverage);
  const bubbleText = formatBubbleScore(isLoading, courseAvgNum, quizAverage);

  return (
    <View className="flex-col items-start p-4 bg-white rounded-xl mb-3">
      {(isLoading || courseTitle) && (
        <Text className="text-xl font-bold mb-6">Course "{courseTitle}"</Text>
      )}

      <View className="flex-row items-center w-full">
        {/* Left - Score Bubble */}
        <View className="items-center w-[92px]">
          <View className="w-16 h-16 justify-center items-center">
            <Image
              source={require('@/src/assets/images/score-bubble-shape.png')}
              className="w-16 h-16"
              resizeMode="contain"
            />
            <View className="absolute inset-0 justify-center items-center" pointerEvents="none">
              <Text className="text-black text-xl font-bold">{bubbleText}</Text>
            </View>
          </View>
          <Text className="mt-2 text-sm text-gray-600 text-center">Average score</Text>
        </View>

        {/* Divider */}
        <View className="w-px h-[75px] bg-gray-100 mx-6" />

        {/* Right - Score Details */}
        <View className="flex-1">
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">Quiz score</Text>
            <Text className="text-lg font-medium">
              {isLoading || quizAverage === null ? '...' : quizAverage.toFixed(1)}
            </Text>
          </View>

          <View className="flex-row justify-between mt-2">
            <Text className="text-sm text-gray-600">Case study score</Text>
            <Text className="text-lg font-medium">
              {isLoading || courseAverage === null ? '...' : courseAverage.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
