import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  useAuthStore,
  useMainRatingStore,
  useUserProgressStore,
  useCourseStore,
} from '@/src/stores';
import { modulesService } from '@/src/services/modules';
import { useQuizStore } from '@/src/stores/quizStore';
import type { Module } from '@/src/constants/types/modules';
// local styles are defined below
import StatsHeader from './StatsHeader';
import ModuleCard from './ModuleCard';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import { Colors } from '@/src/constants/Colors';
import { Skill } from '@/src/constants/types/skill';
import { fetchLessonCountsByModuleIds } from '@/src/services/lessons';

const CourseModulesScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentCourse, fetchCourseById } = useCourseStore();
  const { user } = useAuthStore();
  const { fetchSkills } = useMainRatingStore();
  const quizStore = useQuizStore.getState();

  const [modules, setModules] = useState<Module[]>([]);
  const [skillsMap, setSkillsMap] = useState<Record<string, Skill[]>>({});
  const [quizAverage, setQuizAverage] = useState<number | null>(null);
  const [lessonCountsByModule, setLessonCountsByModule] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState({ modules: true, skills: true, quiz: true });
  const analyticsStore = useAnalyticsStore.getState();

  // 📘 Завантажуємо модулі курсу
  useEffect(() => {
    if (!id) return;
    const loadModules = async () => {
      try {
        const { data } = await modulesService.getModulesByCourse(id);
        setModules(data || []);
      } catch (err) {
        console.error('Error loading modules:', err);
      } finally {
        setLoading((p) => ({ ...p, modules: false }));
      }
    };
    loadModules();
  }, [id]);

  // 📗 Завантажуємо навички по кожному модулю
  useEffect(() => {
    if (!user?.id || !modules.length) return;
    const loadSkills = async () => {
      const map: Record<string, Skill[]> = {};
      for (const mod of modules) {
        try {
          await fetchSkills(user.id, mod.id);
          map[mod.id] = useMainRatingStore.getState().skills;
        } catch {
          map[mod.id] = [];
        }
      }
      setSkillsMap(map);
      setLoading((p) => ({ ...p, skills: false }));
    };
    loadSkills();
  }, [user?.id, modules, fetchSkills]);

  // 📘 Завантажуємо реальні кількості уроків для модулів (для відображення lessons в ModuleCard)
  useEffect(() => {
    if (!modules.length) return;

    let canceled = false;

    const loadCounts = async () => {
      try {
        const moduleIds = modules.map((m) => m.id);
        const { data: counts = {}, error } = await fetchLessonCountsByModuleIds(
          moduleIds as string[],
        );
        if (error) return;
        if (!canceled) setLessonCountsByModule(counts as Record<string, number>);
      } catch {
        // ignore
      }
    };

    loadCounts();
    return () => {
      canceled = true;
    };
  }, [modules]);

  // 📙 Завантажуємо середній бал квіза по курсу
  useEffect(() => {
    if (!id) return;
    const loadQuiz = async () => {
      try {
        const score = await quizStore.getCourseScore(id);
        setQuizAverage(score);
      } catch (err) {
        console.error('Error loading quiz score:', err);
      } finally {
        setLoading((p) => ({ ...p, quiz: false }));
      }
    };
    loadQuiz();
  }, [id, quizStore]);

  // 📊 Середній бал курсу за скілами (case study / AI)
  const courseAverage = useMemo(() => {
    const allSkills = Object.values(skillsMap).flat();
    if (!allSkills.length) return null;

    const total = allSkills.reduce((sum, s) => sum + (s.average_score ?? 0), 0);
    return parseFloat((total / allSkills.length).toFixed(1));
  }, [skillsMap]);

  const isLoading = loading.modules || loading.skills || loading.quiz;

  useEffect(() => {
    if (id) {
      analyticsStore.trackEvent('progress_course_screen__load', { id });
    }
  }, [id, analyticsStore]);

  useEffect(() => {
    if (!id) return;
    // ensure we have course details for the header title
    fetchCourseById(id as string).catch(() => {});
  }, [id, fetchCourseById]);

  return (
    <ScrollView style={localStyles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={localStyles.card}>
        <StatsHeader
          isLoading={isLoading}
          courseAverage={courseAverage}
          quizAverage={quizAverage}
          courseTitle={currentCourse?.title ?? null}
        />

        {loading.modules ? (
          <Text style={localStyles.chartPlaceholderText}>Завантаження модулів...</Text>
        ) : (
          modules.map((module) => {
            // progress модуля з локального стора
            const courseProgressEntry = useUserProgressStore
              .getState()
              .courses.find((c) => c.course_id === id);
            const moduleEntry = courseProgressEntry?.modules?.find(
              (m: any) => m.module_id === module.id,
            );
            const percent = moduleEntry?.progress ?? 0;
            const totalSlides =
              lessonCountsByModule[module.id] ?? (moduleEntry as any)?.total_slides ?? 0;
            const completedSlides = totalSlides ? Math.round((percent / 100) * totalSlides) : 0;

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
};

export default CourseModulesScreen;

const localStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg, padding: 16 },
  // keep wrapper transparent so inner cards (StatsHeader, ModuleCard) are visually separated
  card: { backgroundColor: 'transparent' },
  chartPlaceholderText: { color: '#64748b', textAlign: 'center', marginTop: 16 },
});
