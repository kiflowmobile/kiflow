import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { ScrollView } from '@/shared/ui';
import { useAuth } from '@/features/auth';
import { useAnalytics } from '@/features/analytics';
import { useCourseStore } from '@/features/courses';
import { modulesApi, type Module } from '@/features/modules';
import { useMainRatingStore, type Skill } from '@/features/statistics';
import { useUserProgressStore } from '@/features/progress';
import { useQuizStore } from '@/features/quiz';

import { StatisticsHeader } from './statistics-header';
import { ModuleCard } from './module-card';

export function CourseStatisticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trackEvent } = useAnalytics();
  const { user } = useAuth();
  const { currentCourse, fetchCourseById } = useCourseStore();
  const { fetchSkills } = useMainRatingStore();

  const [modules, setModules] = useState<Module[]>([]);
  const [skillsMap, setSkillsMap] = useState<Record<string, Skill[]>>({});
  const [quizAverage, setQuizAverage] = useState<number | null>(null);
  const [loading, setLoading] = useState({ modules: true, skills: true, quiz: true });

  // Track screen load
  useEffect(() => {
    if (id) {
      trackEvent('progress_course_screen__load', { id });
    }
  }, [id, trackEvent]);

  // Load course details
  useEffect(() => {
    if (id) {
      fetchCourseById(id).catch(() => {});
    }
  }, [id, fetchCourseById]);

  // Load modules
  useEffect(() => {
    if (!id) return;

    modulesApi
      .getModulesByCourse(id)
      .then(({ data }) => setModules(data || []))
      .catch((err) => console.error('Error loading modules:', err))
      .finally(() => setLoading((p) => ({ ...p, modules: false })));
  }, [id]);

  // Load skills for each module
  useEffect(() => {
    if (!user?.id || !modules.length) return;

    const load = async () => {
      const map: Record<string, Skill[]> = {};

      for (const mod of modules) {
        try {
          await fetchSkills(user.id, mod.id);
          map[mod.id] = useMainRatingStore.getState().skills as Skill[];
        } catch {
          map[mod.id] = [];
        }
      }

      setSkillsMap(map);
      setLoading((p) => ({ ...p, skills: false }));
    };

    load();
  }, [user?.id, modules, fetchSkills]);

  // Load quiz average
  useEffect(() => {
    if (!id) return;

    useQuizStore
      .getState()
      .getCourseScore(id)
      .then(setQuizAverage)
      .catch((err) => console.error('Error loading quiz score:', err))
      .finally(() => setLoading((p) => ({ ...p, quiz: false })));
  }, [id]);

  // Calculate course average from skills
  const courseAverage = useMemo(() => {
    const allSkills = Object.values(skillsMap).flat();
    if (!allSkills.length) return null;
    const total = allSkills.reduce((sum, s) => sum + (s.average_score ?? 0), 0);
    return parseFloat((total / allSkills.length).toFixed(1));
  }, [skillsMap]);

  const isLoading = loading.modules || loading.skills || loading.quiz;

  const getModuleProgress = (moduleId: string) => {
    const courseProgress = useUserProgressStore.getState().courses.find((c) => c.course_id === id);
    const moduleEntry = courseProgress?.modules?.find((m: any) => m.module_id === moduleId);
    const percent = moduleEntry?.progress ?? 0;
    const totalSlides = (moduleEntry as any)?.total_slides ?? 0;
    const completedSlides = totalSlides ? Math.round((percent / 100) * totalSlides) : 0;
    return { percent, totalSlides, completedSlides };
  };

  return (
    <ScrollView
      className="flex-1 bg-background-light p-4"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View>
        <StatisticsHeader
          isLoading={isLoading}
          courseAverage={courseAverage}
          quizAverage={quizAverage}
          courseTitle={currentCourse?.title ?? null}
        />

        {loading.modules ? (
          <Text className="text-slate-500 text-center mt-4">Завантаження модулів...</Text>
        ) : (
          modules.map((module) => {
            const { percent, totalSlides, completedSlides } = getModuleProgress(module.id);
            return (
              <ModuleCard
                key={module.id}
                module={module}
                skills={skillsMap[module.id] ?? []}
                loadingSkills={loading.skills}
                percent={percent}
                completedSlides={completedSlides}
                totalSlides={totalSlides}
              />
            );
          })
        )}
      </View>
    </ScrollView>
  );
}
