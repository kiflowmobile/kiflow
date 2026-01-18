import React, { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScrollView, ProgressBar } from '@/shared/ui';
import { useAuth } from '@/features/auth';
import { useAnalytics } from '@/features/analytics';
import { useCourseStore } from '@/features/courses';
import { useModulesStore } from '@/features/modules';
import { useMainRatingStore, useCriteriaStore, type Skill } from '@/features/statistics';
import { useUserProgressStore } from '@/features/progress';
import { useQuizStore } from '@/features/quiz';
import { formatBubbleScore } from '@/features/statistics/utils';

export function StatisticsScreen() {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const { user } = useAuth();
  const { courses, fetchCourses, isLoading: coursesLoading } = useCourseStore();
  const { criterias, fetchAllCriterias } = useCriteriaStore();
  const { fetchUserRatings, ratings } = useMainRatingStore();
  const { modules, fetchModulesByCourses } = useModulesStore();
  const { getCourseProgress, getModuleProgress } = useUserProgressStore();

  const [quizScores, setQuizScores] = useState<Record<string, number | undefined>>({});
  const [skillsByCourse, setSkillsByCourse] = useState<Record<string, Skill[]>>({});
  const [loading, setLoading] = useState({ skills: true, quiz: true });

  // Track screen load
  useEffect(() => {
    trackEvent('progress_screen__load');
  }, [trackEvent]);

  // Load initial data
  useEffect(() => {
    if (user?.id) {
      fetchCourses();
      fetchAllCriterias();
      fetchUserRatings(user.id);
    }
  }, [user?.id, fetchCourses, fetchAllCriterias, fetchUserRatings]);

  // Load modules for courses
  useEffect(() => {
    if (courses.length) {
      fetchModulesByCourses(courses.map((c) => c.id));
    }
  }, [courses, fetchModulesByCourses]);

  // Load quiz scores
  useEffect(() => {
    if (!courses.length) {
      setLoading((s) => ({ ...s, quiz: false }));
      return;
    }

    let canceled = false;
    const load = async () => {
      setLoading((s) => ({ ...s, quiz: true }));
      const map: Record<string, number | undefined> = {};
      const quizStore = useQuizStore.getState();

      for (const c of courses) {
        try {
          map[c.id] = await quizStore.getCourseScore(c.id);
        } catch {
          map[c.id] = undefined;
        }
      }

      if (!canceled) {
        setQuizScores(map);
        setLoading((s) => ({ ...s, quiz: false }));
      }
    };

    load();
    return () => {
      canceled = true;
    };
  }, [courses]);

  // Load skills for each course
  useEffect(() => {
    if (!user?.id || !modules.length || !courses.length) {
      setLoading((s) => ({ ...s, skills: false }));
      return;
    }

    let canceled = false;
    const load = async () => {
      setLoading((s) => ({ ...s, skills: true }));
      const map: Record<string, Skill[]> = {};
      const { fetchSkills } = useMainRatingStore.getState();

      for (const course of courses) {
        const courseModules = modules.filter((m) => m.course_id === course.id);
        const acc: Skill[] = [];

        for (const mod of courseModules) {
          try {
            await fetchSkills(user.id, mod.id);
            const skills = useMainRatingStore.getState().skills as Skill[];
            if (skills?.length) acc.push(...skills);
          } catch {}
        }

        map[course.id] = acc;
      }

      if (!canceled) {
        setSkillsByCourse(map);
        setLoading((s) => ({ ...s, skills: false }));
      }
    };

    load();
    return () => {
      canceled = true;
    };
  }, [user?.id, modules, courses]);

  const getModulesCount = (courseId: string) =>
    modules.filter((m) => m.course_id === courseId).length;

  const getCompletedModulesCount = (courseId: string) => {
    const courseModules = modules.filter((m) => m.course_id === courseId);
    return courseModules.reduce((acc, m) => {
      try {
        return acc + (getModuleProgress(courseId, m.id) >= 100 ? 1 : 0);
      } catch {
        return acc;
      }
    }, 0);
  };

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
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {courses.map((course) => {
          const courseSkills = skillsByCourse[course.id] ?? [];
          const courseAvgNum = courseSkills.length
            ? parseFloat(
                (
                  courseSkills.reduce((sum, s) => sum + (s.average_score || 0), 0) /
                  courseSkills.length
                ).toFixed(1),
              )
            : 0;
          const quizAvg = quizScores[course.id];

          return (
            <Pressable
              key={course.id}
              className="mb-4 p-4 rounded-xl bg-white shadow-md"
              onPress={() => handleCoursePress(course.id)}
            >
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
                            {formatBubbleScore(
                              loading.skills || loading.quiz,
                              courseAvgNum,
                              quizAvg,
                            )}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-sm text-gray-500 mt-1">Score</Text>
                    </View>
                  </View>

                  {/* Modules Count */}
                  <Text className="text-sm text-gray-500 my-1.5">
                    {`${getCompletedModulesCount(course.id)}/${getModulesCount(course.id)} modules`}
                  </Text>

                  {/* Progress Bar */}
                  <View className="flex-row items-center gap-2 mb-2">
                    <ProgressBar percent={getCourseProgress(course.id)} height={8} />
                  </View>

                  {/* Skills Section */}
                  <View className="mt-2 pt-3 border-t border-gray-100">
                    <Text className="text-base font-bold mb-2">Skills level</Text>

                    {criterias
                      .filter((c) => c.course_id === course.id)
                      .slice(0, 4)
                      .map((item) => {
                        const skill = ratings.find((s) => s.criteria_key === item.key);
                        const score = Math.round(skill?.rating ?? 0);

                        return (
                          <View
                            key={item.id}
                            className="flex-row items-center justify-between mb-2"
                          >
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
                              <Text className="text-sm font-bold text-gray-900">
                                {`${skill?.rating ?? 0}/5`}
                              </Text>
                            </View>
                          </View>
                        );
                      })}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
