import { AverageScore } from '@/components/progress/average-score';
import { SkillsLevel } from '@/components/progress/skills-level';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Typography } from '@/components/ui/typography';
import { useInitialLoad } from '@/hooks/use-initial-load';
import {
  calculateModuleProgress,
  getAssessmentCriteria,
  getCourseById,
  getCourseWithModulesAndLessons,
  getLessonById,
  getModuleById,
  getSlideById,
  getUserCourseSlideInteractions,
  getUserModuleCriteriaScores,
  getUserProgress,
} from '@/lib/database';
import { AssessmentCriterion, Course, Lesson, Module, UserModuleCriteriaScore } from '@/lib/types';
import { useAuthStore } from '@/store/auth-store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModuleWithProgress extends Module {
  progress: number;
  lessons: Lesson[];
  criteriaScores: UserModuleCriteriaScore[];
  completedLessonsCount: number;
}

export default function CourseProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { loading, startLoading, finishLoading } = useInitialLoad(`${id}-progress`);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithProgress[]>([]);
  const [criteria, setCriteria] = useState<AssessmentCriterion[]>([]);
  const [quizScore, setQuizScore] = useState(0);
  const [caseStudyScore, setCaseStudyScore] = useState(0);

  const loadProgressData = useCallback(async () => {
    if (!id || !user) {
      finishLoading();
      return;
    }

    try {
      startLoading();

      const [courseData, criteriaData, { modules: modulesData }, interactions] = await Promise.all([
        getCourseById(id),
        getAssessmentCriteria(id),
        getCourseWithModulesAndLessons(id),
        getUserCourseSlideInteractions(user.id, id),
      ]);

      if (!courseData) {
        router.back();
        return;
      }

      setCourse(courseData);
      setCriteria(criteriaData);

      let totalQuizScore = 0;
      let quizCount = 0;
      let totalCaseScore = 0;
      let caseCount = 0;

      interactions.forEach((interaction) => {
        if (interaction.type === 'quiz') {
          totalQuizScore += interaction.score;
          quizCount++;
        } else if (interaction.type === 'case_study') {
          totalCaseScore += interaction.score;
          caseCount++;
        }
      });

      setQuizScore(quizCount > 0 ? totalQuizScore / quizCount : 0);
      setCaseStudyScore(caseCount > 0 ? totalCaseScore / caseCount : 0);

      const modulesWithProgress = await Promise.all(
        modulesData.map(async (module) => {
          const [progress, criteriaScores] = await Promise.all([
            calculateModuleProgress(user.id, module.id),
            getUserModuleCriteriaScores(user.id, module.id),
          ]);

          let completedLessonsCount = 0;
          const courseProgress = await getUserProgress(user.id, id);

          for (const lesson of module.lessons) {
            // A lesson is considered completed if its progress (based on last_slide_id)
            // has reached or passed this lesson.
            if (courseProgress?.last_slide_id) {
              const lastSlide = await getSlideById(courseProgress.last_slide_id);
              if (lastSlide) {
                const lastLesson = await getLessonById(lastSlide.lesson_id);
                const lastModule = await getModuleById(lastLesson?.module_id || '');

                if (lastModule && lastLesson) {
                  const isPastModule = lastModule.order_index > module.order_index;
                  const isSameModule = lastModule.id === module.id;
                  const isPastLesson = lastLesson.order_index > lesson.order_index;
                  const isSameLesson = lastLesson.id === lesson.id;

                  if (isPastModule || (isSameModule && (isPastLesson || isSameLesson))) {
                    completedLessonsCount++;
                  }
                }
              }
            }
          }

          return {
            ...module,
            progress,
            criteriaScores,
            completedLessonsCount,
          };
        }),
      );

      setModules(modulesWithProgress);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      finishLoading();
    }
  }, [id, user, router, startLoading, finishLoading]);

  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  const averageScore = (() => {
    const scores = [];
    if (quizScore > 0) scores.push(quizScore);
    if (caseStudyScore > 0) scores.push(caseStudyScore);
    if (scores.length === 0) return '0.0';
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  })();

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#5774CD" />
      </View>
    );
  }

  if (!course) return null;

  return (
    <View className="flex-1 bg-bg">
      <View style={{ paddingTop: insets.top + 16 }} className="px-4 pb-8 relative">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          className="absolute z-10 left-4"
          style={{ top: insets.top + 16 }}
        >
          <IconSymbol name="chevron.left" size={24} color="#0A0A0A" />
        </TouchableOpacity>

        <Typography variant="title2" className="text-center">
          Course progress
        </Typography>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <View className="bg-white p-4 rounded-xl mb-4 shadow-sm">
          <Typography variant="title2" className="mb-6">
            Course “{course.title}”
          </Typography>

          <View className="flex-row items-center">
            <AverageScore score={averageScore} />

            <View className="w-px h-20 bg-[#E0E0E0] mx-4" />

            <View className="flex-1 gap-3">
              <View className="flex-row justify-between items-center">
                <Typography variant="body2" className="text-[#525252]">
                  Quiz score
                </Typography>
                <Typography variant="title3">{quizScore.toFixed(1)}</Typography>
              </View>

              <View className="flex-row justify-between items-center">
                <Typography variant="body2" className="text-[#525252]">
                  Case study score
                </Typography>
                <Typography variant="title3">{caseStudyScore.toFixed(1)}</Typography>
              </View>
            </View>
          </View>
        </View>

        <View className="gap-4">
          {modules.map((module, index) => (
            <View key={module.id} className="bg-white p-4 rounded-xl shadow-sm">
              <View className="flex-row justify-between items-start">
                <View>
                  <Typography variant="title2">Module {index + 1}</Typography>
                  <Typography variant="body2" className="text-[#737373] mt-1">
                    {module.completedLessonsCount}/{module.lessons.length} lessons
                  </Typography>
                </View>

                {module.progress === 100 && (
                  <View className="bg-[#5EA500] px-2.5 py-1 rounded-full">
                    <Typography className="text-white text-[14px] font-semibold">
                      Completed
                    </Typography>
                  </View>
                )}
              </View>

              {module.criteriaScores.length > 0 && (
                <>
                  <View className="h-px bg-[#E0E0E0] my-4" />
                  <SkillsLevel
                    scores={module.criteriaScores.map((s) => ({
                      title: criteria.find((c) => c.id === s.criterion_id)?.title || 'Skill',
                      score: s.score,
                    }))}
                  />
                </>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
