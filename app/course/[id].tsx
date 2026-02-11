import { IconSymbol } from '@/components/ui/icon-symbol';
import { ProgressBar } from '@/components/ui/progress-bar';
import {
  calculateModuleProgress,
  getCourseWithModulesAndLessons,
  getUserProgress,
} from '@/lib/database';
import { Lesson, Module, Slide } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LessonWithSlides extends Lesson {
  slides: Slide[];
}

export default function CourseDetailScreen() {
  const router = useRouter();
  const { id, startAgain } = useLocalSearchParams<{ id: string; startAgain?: string }>();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['course', id, user?.id],
    queryFn: async () => {
      if (!id || !user) return null;

      const { course: courseData, modules: modulesData } = await getCourseWithModulesAndLessons(id);

      if (!courseData) {
        return null;
      }

      // Fetch progress for each module
      const modulesWithProgress = await Promise.all(
        modulesData.map(async (m) => {
          const progress = await calculateModuleProgress(user.id, m.id);
          return { ...m, progress };
        }),
      );

      return {
        course: courseData,
        modules: modulesWithProgress,
      };
    },
    enabled: !!id && !!user,
  });

  const course = data?.course;
  const modules = data?.modules || [];

  useEffect(() => {
    if (startAgain === 'true' && modules.length > 0) {
      const firstModule = modules[0];
      if (firstModule.lessons.length > 0) {
        const firstLesson = firstModule.lessons[0];
        router.replace(`/course/${id}/module/${firstModule.id}/lesson/${firstLesson.id}`);
      }
    }
  }, [modules, startAgain, id, router]);

  useEffect(() => {
    // If we loaded and there's no course data (and no error), user might have been redirected inside queryFn or it's invalid
    if (!isLoading && data === null && id && user) {
      router.back();
    }
  }, [isLoading, data, id, user, router]);

  const handleModulePress = async (moduleId: string) => {
    if (!user || !id) return;

    const progress = await getUserProgress(user.id, id);
    const module = modules.find((m) => m.id === moduleId);
    if (!module || module.lessons.length === 0) {
      return;
    }

    if (progress?.last_slide_id) {
      for (const lesson of module.lessons) {
        const slideIndex = lesson.slides.findIndex((s) => s.id === progress.last_slide_id);
        if (slideIndex >= 0) {
          router.push(`/course/${id}/module/${moduleId}/lesson/${lesson.id}`);
          return;
        }
      }
    }

    const firstLesson = module.lessons[0];
    router.push(`/course/${id}/module/${moduleId}/lesson/${firstLesson.id}`);
  };

  if (
    isLoading ||
    (startAgain === 'true' && modules.length > 0 && modules[0]?.lessons.length > 0)
  ) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#5774CD" />
      </View>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <View className="flex-row items-center justify-between pt-4 px-4">
        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/courses`)}
          className="w-6 h-6 justify-center items-center"
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <IconSymbol name="chevron.left" size={24} color="#0A0A0A" />
        </TouchableOpacity>

        <Text className="text-title-3 font-semibold text-text">Course Details</Text>

        <View className="w-6" />
      </View>

      <ScrollView contentContainerClassName="flex-1 px-4 pb-4" showsVerticalScrollIndicator={false}>
        <Text className="text-title-2 mb-4 mt-8">Course &quot;{course.title}&quot;</Text>

        <View className="gap-2.5">
          {modules.map((module, index) => {
            const lessonCount = module.lessons.reduce(
              (total, lesson) => total + lesson.slides.length,
              0,
            );
            const isCompleted = module.progress === 100;
            const hasStarted = module.progress > 0 && module.progress < 100;
            const isLast = index === modules.length - 1;

            return (
              <View key={module.id} className="flex-row gap-3">
                <View className="w-6 justify-center items-center">
                  <View className="flex-1 w-full justify-center items-center relative">
                    {index > 0 && (
                      <View
                        className={cn(
                          'absolute w-0.5 left-[11px] -top-6 h-[calc(50%+24px)]',
                          modules[index - 1].progress === 100 ? 'bg-[#65A30D]' : 'bg-neutral-200',
                        )}
                      />
                    )}

                    {!isLast && (
                      <View
                        className={cn(
                          'absolute w-0.5 left-[11px] bottom-0 h-1/2',
                          isCompleted ? 'bg-[#65A30D]' : 'bg-neutral-200',
                        )}
                      />
                    )}

                    {isCompleted ? (
                      <View className="z-10 bg-bg rounded-full">
                        <IconSymbol name="checkmark.circle.fill" size={24} color="#65A30D" />
                      </View>
                    ) : hasStarted || (index === 0 && module.progress === 0) ? (
                      <View className="w-6 h-6 rounded-full border-2 border-text justify-center items-center bg-bg z-10">
                        <View className="w-2.5 h-2.5 rounded-full bg-text" />
                      </View>
                    ) : (
                      <View className="w-6 h-6 rounded-full border-2 border-neutral-200 bg-neutral-100 z-10" />
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  className="flex-1 rounded-xl p-4 bg-white"
                  onPress={() => handleModulePress(module.id)}
                  activeOpacity={0.8}
                >
                  <View className="flex-row justify-between items-center gap-2">
                    <Text className="flex-1 text-title-2" numberOfLines={2}>
                      Module {index + 1}
                    </Text>

                    <View className="bg-primary px-2.5 py-1 rounded-full">
                      <Text className="text-white text-caption font-semibold">
                        {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
                      </Text>
                    </View>
                  </View>

                  {module.progress > 0 && module.progress < 100 && (
                    <ProgressBar progress={module.progress} className="mt-3" />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
