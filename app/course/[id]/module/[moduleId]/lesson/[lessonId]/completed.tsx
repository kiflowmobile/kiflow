import { CheckmarkIcon } from '@/components/icons/checkmark-icon';
import { AverageScore } from '@/components/progress/average-score';
import { SkillsLevel } from '@/components/progress/skills-level';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Typography } from '@/components/ui/typography';
import {
  getAssessmentCriteria,
  getLessonCriteriaScores,
  getLessonQuizScores,
  getLessonsByModuleId,
  getModulesByCourseId,
  getSlidesByLessonId,
  updateUserProgress,
} from '@/lib/database';
import { useAuthStore } from '@/store/auth-store';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HeaderBg = ({ className }: { className?: string }) => {
  return (
    <View className={className}>
      <svg width="100%" height="100%" viewBox="0 0 390 200" fill="none" preserveAspectRatio="none">
        <path
          d="M0 0H390V176.5C390 176.5 292.5 200 195 200C97.5 200 0 176.5 0 176.5V0Z"
          fill="#5EA500"
        />
      </svg>
    </View>
  );
};

export default function LessonCompletedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    id: courseId,
    moduleId,
    lessonId,
  } = useLocalSearchParams<{
    id: string;
    moduleId: string;
    lessonId: string;
  }>();
  const { user } = useAuthStore();
  const [nextLessonId, setNextLessonId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['lesson-completed', lessonId, moduleId, courseId, user?.id],
    queryFn: async () => {
      if (!moduleId || !lessonId || !courseId || !user) return null;

      // Get all lessons in the module
      const [lessons, criteriaData, criteriaScores, quizScoresData] = await Promise.all([
        getLessonsByModuleId(moduleId),
        getAssessmentCriteria(courseId),
        getLessonCriteriaScores(user.id, lessonId),
        getLessonQuizScores(user.id, lessonId),
      ]);

      const currentIndex = lessons.findIndex((l) => l.id === lessonId);
      let targetNextLessonId: string | null = null;
      let targetNextSlideId: string | null = null;

      if (currentIndex < lessons.length - 1) {
        // There's a next lesson in current module
        targetNextLessonId = lessons[currentIndex + 1].id;
      } else {
        // Check if there's a next module
        const modules = await getModulesByCourseId(courseId);
        const currentModuleIndex = modules.findIndex((m) => m.id === moduleId);

        if (currentModuleIndex < modules.length - 1) {
          // There's a next module, get its first lesson
          const nextModuleLessons = await getLessonsByModuleId(modules[currentModuleIndex + 1].id);
          if (nextModuleLessons.length > 0) {
            targetNextLessonId = nextModuleLessons[0].id;
          }
        }
      }

      if (targetNextLessonId) {
        // Get the first slide of the next lesson to update progress
        const nextSlides = await getSlidesByLessonId(targetNextLessonId);
        if (nextSlides.length > 0) {
          targetNextSlideId = nextSlides[0].id;
        }
      }

      // Update user progress to the next slide (start of next lesson)
      if (targetNextSlideId) {
        await updateUserProgress(user.id, courseId, targetNextSlideId);
      }

      return {
        criteria: criteriaData,
        criteriaScores: criteriaScores,
        quizScores: quizScoresData,
        nextLessonId: targetNextLessonId,
      };
    },
    enabled: !!moduleId && !!lessonId && !!courseId && !!user,
  });

  const criteria = data?.criteria || [];
  const criteriaScores = data?.criteriaScores || [];
  const quizScores = data?.quizScores || [];

  useEffect(() => {
    if (data?.nextLessonId) {
      setNextLessonId(data.nextLessonId);
    }
  }, [data?.nextLessonId]);

  const handleNextLesson = async () => {
    if (!nextLessonId || !moduleId || !courseId) return;

    // Find which module the next lesson belongs to
    const modules = await getModulesByCourseId(courseId);
    for (const module of modules) {
      const lessons = await getLessonsByModuleId(module.id);
      if (lessons.some((l) => l.id === nextLessonId)) {
        router.replace(`/course/${courseId}/module/${module.id}/lesson/${nextLessonId}`);
        return;
      }
    }
  };

  const averageScore = (() => {
    const allScores = [...criteriaScores.map((s) => s.score), ...quizScores.map((s) => s.score)];

    if (allScores.length === 0) return '0.0';

    return (allScores.reduce((acc, curr) => acc + curr, 0) / allScores.length).toFixed(1);
  })();

  if (isLoading) {
    return (
      <View className="flex-1 bg-bg justify-center items-center">
        <ActivityIndicator size="large" color="#5774CD" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg">
      <ScrollView className="flex-1">
        <View className="pb-10 mb-8 relative">
          <HeaderBg className="absolute inset-0" />

          <View
            style={{
              paddingTop: insets.top + 16,
              paddingLeft: insets.left + 16,
              paddingRight: insets.right + 16,
            }}
          >
            <TouchableOpacity
              onPress={() => router.push(`/course/${courseId}`)}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <IconSymbol name="xmark" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View className="mx-auto w-9 h-9 rounded-full bg-white justify-center items-center mb-4 mt-8">
              <CheckmarkIcon width={24} height={24} />
            </View>

            <Typography variant="titleLarge" className="text-white text-center">
              Lesson completed!
            </Typography>
          </View>
        </View>

        <View className="bg-white mx-4 mb-4 rounded-xl px-4 py-6 items-center shadow-sm">
          <Typography variant="title2" className="mb-3">
            Your results
          </Typography>

          <AverageScore score={averageScore} variant="title1" />

          <SkillsLevel
            scores={criteriaScores.map((s) => ({
              title: criteria.find((c) => c.id === s.criterion_id)?.title || 'Skill',
              score: s.score,
            }))}
            title="Skills level"
          />
        </View>
      </ScrollView>

      <View
        style={{
          paddingBottom: insets.bottom + 16,
          paddingLeft: insets.left + 16,
          paddingRight: insets.right + 16,
        }}
      >
        <Button
          size="big"
          onPress={nextLessonId ? handleNextLesson : () => router.replace('/(tabs)/courses')}
        >
          {nextLessonId ? 'Next lesson' : 'Back to Courses'}
        </Button>
      </View>
    </View>
  );
}
