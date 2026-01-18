import React, { useEffect, useMemo, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';

import { Button, ProgressBar } from '@/shared/ui';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useAnalytics } from '@/features/analytics';
import { useCourseProgress, useUserProgressStore } from '@/features/progress';
import { navigateToCourse } from '../utils/navigate-to-course';
import type { Course } from '../types';

import ArrowRight from '@/src/assets/images/arrow-right.svg';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { trackEvent } = useAnalytics();
  const { fetchUserProgress, resetCourseProgress } = useUserProgressStore();
  const { courseProgress, lastSlideId, modules } = useCourseProgress(course.id);
  const [isDeveloper, setIsDeveloper] = useState(false);

  const totalModules = useMemo(() => {
    return course.modules?.length || modules?.length || 0;
  }, [course.modules, modules]);

  const isCompleted = courseProgress === 100;
  const isInProgress = courseProgress > 0 && courseProgress < 100;
  const isNotStarted = courseProgress === 0;

  useEffect(() => {
    if (user) {
      fetchUserProgress(user.id);
    }
  }, [user, fetchUserProgress]);

  useEffect(() => {
    AsyncStorage.getItem('isDeveloper').then((value) => {
      if (value === 'true') setIsDeveloper(true);
    });
  }, []);

  const handleStartCourse = () => {
    if (isNotStarted) {
      trackEvent('course__start', { id: course.id });
    }

    trackEvent('courses_screen__course__click', {
      id: course.id,
      progress: courseProgress,
    });

    const moduleProgress = modules?.find((m) => m.last_slide_id === lastSlideId)?.progress;
    navigateToCourse(router, course.id, lastSlideId, moduleProgress);
  };

  const handleResetProgress = async () => {
    if (!user) return;

    try {
      resetCourseProgress(course.id);
      await AsyncStorage.multiRemove([`quiz-progress-${course.id}`, `course-chat-${course.id}`]);
    } catch (err) {
      console.error('Error resetting course progress:', err);
    }
  };

  const renderButton = () => {
    if (isNotStarted) {
      return (
        <Button
          title="Start course"
          variant="dark"
          size="md"
          onPress={handleStartCourse}
          style={{ width: '100%', marginTop: 16 }}
          icon={<ArrowRight />}
          iconPosition="right"
        />
      );
    }

    if (isInProgress) {
      return (
        <Button
          title="Continue"
          variant="dark"
          size="md"
          onPress={handleStartCourse}
          style={{ width: '100%', marginTop: 16 }}
          icon={
            <Svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Path d="M5 12h14" />
              <Path d="M12 5l7 7-7 7" />
            </Svg>
          }
          iconPosition="right"
        />
      );
    }

    return (
      <Button
        title="Start again"
        variant="accent"
        size="md"
        onPress={handleStartCourse}
        style={{ width: '100%', marginTop: 16 }}
      />
    );
  };

  return (
    <TouchableOpacity
      className="rounded-2xl bg-white overflow-hidden shadow-md"
      onPress={handleStartCourse}
      activeOpacity={0.7}
    >
      {/* Image Section */}
      <View className="relative">
        <Image
          source={{ uri: course.image || 'https://picsum.photos/800/600' }}
          className="w-full h-[200px]"
          resizeMode="cover"
        />

        {/* Badges */}
        <View className="absolute bottom-3 left-3 flex-row gap-2">
          {totalModules > 0 && (
            <View className="bg-[#5774CD] px-2.5 py-1.5 rounded-xl">
              <Text className="text-white text-xs font-medium">{totalModules} modules</Text>
            </View>
          )}
          {isCompleted && (
            <View className="bg-green-500 px-2.5 py-1.5 rounded-xl">
              <Text className="text-white text-xs font-medium">Completed</Text>
            </View>
          )}
        </View>

        {/* Developer Reset Button */}
        {isDeveloper && courseProgress > 0 && (
          <TouchableOpacity
            className="absolute top-2.5 right-2.5 bg-red-500 p-1.5 rounded-full opacity-90"
            onPress={handleResetProgress}
          >
            <Svg
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
              <Path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
            </Svg>
          </TouchableOpacity>
        )}
      </View>

      {/* Content Section */}
      <View className="p-4 gap-2">
        {isInProgress && <ProgressBar percent={courseProgress} height={8} />}

        <Text className="text-lg font-bold mt-1">{course.title}</Text>
        <Text className="text-sm text-gray-700 leading-[18px]" numberOfLines={2}>
          {course.description || 'Опис відсутній'}
        </Text>

        <View className="w-full">{renderButton()}</View>
      </View>
    </TouchableOpacity>
  );
};
