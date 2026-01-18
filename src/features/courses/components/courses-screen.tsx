import { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { SafeAreaView, ScrollView } from '@/shared/ui';
import { useCourseStore } from '@/features/courses';
import { useAnalytics } from '@/features/analytics';
import { CourseCard } from './course-card';

export const CoursesScreen = () => {
  const { courses, isLoading, error, fetchCourses, clearError } = useCourseStore();
  const { trackEvent } = useAnalytics();
  const router = useRouter();

  useEffect(() => {
    fetchCourses().catch((err) => {
      console.error('Error loading courses:', err);
    });
  }, [fetchCourses]);

  useEffect(() => {
    trackEvent('courses_screen__load');
  }, [trackEvent]);

  const handleRetry = () => {
    clearError();
    fetchCourses();
  };

  const handleEnterCode = () => {
    trackEvent('courses_screen__enter_code__click');
    router.push('/course-code');
  };

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background-light">
        <View className="items-center p-5">
          <Text className="text-red-500 text-center mb-2.5">Помилка: {error}</Text>
          <Text className="text-blue-500 text-center underline" onPress={handleRetry}>
            Спробувати знову
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background-light">
        <View className="flex-1 items-center justify-center">
          <Text className="text-center text-gray-500">Завантаження курсів...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (courses.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background-light">
        <View className="flex-1 items-center justify-center mt-60">
          <Image
            source={require('@/src/assets/images/book.png')}
            className="w-[100px] h-[100px] mb-6"
            resizeMode="contain"
          />
          <Text className="text-center text-base mb-4 px-10">
            Your course list is empty. If you skipped entering your company code, you can try again
            now.
          </Text>
          <TouchableOpacity activeOpacity={0.7} onPress={handleEnterCode}>
            <Text className="text-blue-500 font-semibold">Enter code</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background-light">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="gap-4">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
