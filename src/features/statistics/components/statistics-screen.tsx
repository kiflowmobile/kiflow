import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScrollView } from '@/shared/ui';
import { useAnalytics } from '@/features/analytics';
import { useStatisticsData } from '../hooks/useStatisticsData';
import { CourseStatisticsCard } from './CourseStatisticsCard';

export function StatisticsScreen() {
  const router = useRouter();
  const { trackEvent } = useAnalytics();

  const {
    courses,
    criteria,
    ratings,
    coursesLoading,
    quizScores,
    loading,
    getCourseProgress,
    getModulesCount,
    getCompletedModulesCount,
    getCourseAverage,
  } = useStatisticsData();

  useEffect(() => {
    trackEvent('progress_screen__load');
  }, [trackEvent]);

  const handleCoursePress = (courseId: string) => {
    trackEvent('progress_screen__course__click', { id: courseId });
    router.push({ pathname: '/statistics/[id]', params: { id: courseId } });
  };

  if (coursesLoading) {
    return (
      <View className="flex-1 bg-background-light p-4">
        <Text className="text-center text-gray-500">Завантаження курсів...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background-light p-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {courses.map((course) => (
          <CourseStatisticsCard
            key={course.id}
            course={course}
            courseAverage={getCourseAverage(course.id)}
            quizScore={quizScores[course.id]}
            progress={getCourseProgress(course.id)}
            modulesCount={getModulesCount(course.id)}
            completedModulesCount={getCompletedModulesCount(course.id)}
            criteria={criteria.filter((c) => c.course_id === course.id)}
            ratings={ratings}
            isLoading={loading.skills || loading.quiz}
            onPress={() => handleCoursePress(course.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
