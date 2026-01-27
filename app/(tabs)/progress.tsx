import { AverageScore } from "@/components/progress/average-score";
import { SkillsLevel } from "@/components/progress/skills-level";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { useInitialLoad } from "@/hooks/use-initial-load";
import {
  calculateCourseProgress,
  getAssessmentCriteria,
  getCourses,
  getModulesByCourseId,
  getUserCourseCriteriaScores,
  getUserCourseSlideInteractions,
} from "@/lib/database";
import { AssessmentCriterion, Course, UserModuleCriteriaScore } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface CourseWithProgress extends Course {
  progress: number;
  averageScore: number;
  completedModules: number;
  totalModules: number;
  criteria: AssessmentCriterion[];
  criteriaScores: UserModuleCriteriaScore[];
}

export default function ProgressScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [courses, setCourses] = useState<CourseWithProgress[]>([]);
  const { loading, startLoading, finishLoading } = useInitialLoad(user?.id || "");

  const loadProgress = useCallback(async () => {
    if (!user) {
      finishLoading();
      return;
    }

    try {
      startLoading();
      const allCourses = await getCourses(user.id);

      // Calculate progress and details for each course
      const coursesWithProgress = (
        await Promise.all(
          allCourses.map(async (course) => {
            const [progressPercentage, criteria, modules, interactions, criteriaScores] = await Promise.all([
              calculateCourseProgress(user.id, course.id),
              getAssessmentCriteria(course.id),
              getModulesByCourseId(course.id),
              getUserCourseSlideInteractions(user.id, course.id),
              getUserCourseCriteriaScores(user.id, course.id),
            ]);

            // If no progress and no interactions, skip this course
            if (progressPercentage === 0 && interactions.length === 0) {
              return null;
            }

            // Calculate average score from all interactions
            const allScores = interactions.map((i) => i.score);
            const averageScore =
              allScores.length > 0 ? allScores.reduce((acc, curr) => acc + curr, 0) / allScores.length : 0;

            return {
              ...course,
              progress: progressPercentage,
              averageScore: averageScore,
              completedModules: 0,
              totalModules: modules.length,
              criteria: criteria,
              criteriaScores: criteriaScores,
            };
          })
        )
      ).filter((c): c is CourseWithProgress => c !== null);

      // Sort courses by uncompleted first
      coursesWithProgress.sort((a, b) => {
        if (a.progress === 100 && b.progress < 100) return 1;
        if (a.progress < 100 && b.progress === 100) return -1;
        return a.progress - b.progress;
      });

      setCourses(coursesWithProgress);
    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      finishLoading();
    }
  }, [user, startLoading, finishLoading]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const handleCoursePress = (courseId: string) => {
    router.push(`/course/${courseId}/progress`);
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#F4F4F4] items-center justify-center">
        <ActivityIndicator size="large" color="#5EA500" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#F4F4F4]"
      contentContainerClassName="flex-1"
      contentContainerStyle={{ paddingTop: insets.top }}
    >
      <View className="flex-1 p-4">
        <Typography variant="titleLarge" className="mt-4 mb-6">
          Your progress
        </Typography>

        {courses.length === 0 ? (
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-body-1 text-neutral text-center">
              Start your first lesson to see your progress and skills grow here.
            </Text>

            <Button onPress={() => router.replace("/(tabs)/courses")} className="mt-6 px-[60px]">
              Start a course
            </Button>
          </View>
        ) : (
          <View className="gap-4">
            {courses.map((course) => (
              <TouchableOpacity
                key={course.id}
                className="bg-white rounded-xl p-4 mb-2 shadow-sm"
                onPress={() => handleCoursePress(course.id)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-start gap-3">
                  <View className="w-20 h-20 rounded-lg overflow-hidden bg-[#C1C1C1]">
                    {course.image_url ? (
                      <Image source={{ uri: course.image_url }} className="w-full h-full" contentFit="cover" />
                    ) : (
                      <View className="w-full h-full bg-[#F0F0F0]" />
                    )}
                  </View>

                  <View className="flex-1">
                    <Typography variant="title3" className="mb-1" numberOfLines={2}>
                      Course “{course.title}”
                    </Typography>

                    <View className="mt-1">
                      {course.progress === 100 ? (
                        <View className="bg-[#5EA500] px-2.5 py-1 rounded-full self-start">
                          <Typography className="text-white text-[14px] font-semibold">Completed</Typography>
                        </View>
                      ) : (
                        <Typography variant="body2" className="text-[#737373]">
                          {course.totalModules} modules
                        </Typography>
                      )}
                    </View>
                  </View>

                  <View className="items-end">
                    <AverageScore score={course.averageScore.toFixed(1)} label="Score" variant="title2" />
                  </View>
                </View>

                {course.progress < 100 && (
                  <View className="mt-4">
                    <View className="flex-row items-center gap-3">
                      <View className="flex-1 h-2 bg-[#EEEFF1] rounded-full overflow-hidden">
                        <View className="h-full bg-[#5EA500] rounded-full" style={{ width: `${course.progress}%` }} />
                      </View>
                      <Typography variant="title3" className="w-10 text-right">
                        {course.progress}%
                      </Typography>
                    </View>
                  </View>
                )}

                {course.criteriaScores.length > 0 && (
                  <>
                    <View className="h-px bg-[#E0E0E0] my-4" />
                    <SkillsLevel
                      scores={course.criteriaScores.map((s) => ({
                        title: course.criteria.find((c) => c.id === s.criterion_id)?.title || "Skill",
                        score: s.score,
                      }))}
                    />
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
