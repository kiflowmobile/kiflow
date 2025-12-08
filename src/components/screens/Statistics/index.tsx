import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCourseStore } from '@/src/stores/courseStore';
import { useCriteriaStore } from '@/src/stores/criterias';
import { useMainRatingStore } from '@/src/stores/mainRatingStore';
import { useAuthStore, useModulesStore, useUserProgressStore } from '@/src/stores';
import { useQuizStore } from '@/src/stores/quizStore';
import { useRouter } from 'expo-router';
import { shadow } from '../../ui/styles/shadow';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import ModuleCard from './ModuleCard';
import { fetchLessonCountsByModuleIds } from '@/src/services/lessons';
import { Colors } from '@/src/constants/Colors';
import ProgressBar from '@/src/components/ui/progress-bar';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';
import { formatBubbleScore } from '@/src/utils/scoreUtils';

export default function StatisticsScreen() {
  const { courses, fetchCourses, isLoading: coursesLoading } = useCourseStore();
  const { fetchAllCriterias } = useCriteriaStore();
  const { fetchUserRatings } = useMainRatingStore();
  const { modules, fetchMyModulesByCourses } = useModulesStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const analyticsStore = useAnalyticsStore.getState();

  const { getCourseProgress, getModuleProgress } = useUserProgressStore();
  interface Skill {
    criterion_id: string;
    criterion_name: string;
    average_score: number;
  }

  // quiz scores per courseId
  const [quizScores, setQuizScores] = useState<Record<string, number | undefined>>({});
  // skills aggregated per courseId (collected from modules)
  const [skillsByCourse, setSkillsByCourse] = useState<Record<string, Skill[]>>({});
  // real lessons counts per course (from lessons service + user progress)
  const [lessonsCountsByCourse, setLessonsCountsByCourse] = useState<
    Record<string, { totalLessons: number; completedLessons: number }>
  >({});
  // loading flags
  const [loading, setLoading] = useState({ skills: true, quiz: true });

  // Load quiz scores for visible courses
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
          const score = await quizStore.getCourseScore(c.id);
          map[c.id] = score;
        } catch {
          map[c.id] = undefined;
        }
      }
      if (!canceled) setQuizScores(map);
      if (!canceled) setLoading((s) => ({ ...s, quiz: false }));
    };
    load();
    return () => {
      canceled = true;
    };
  }, [courses]);

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
            const skills = useMainRatingStore.getState().skills as unknown as Skill[];
            if (skills && skills.length) acc.push(...skills);
          } catch {}
        }
        map[course.id] = acc;
      }
      if (!canceled) setSkillsByCourse(map);
      if (!canceled) setLoading((s) => ({ ...s, skills: false }));
    };
    load();
    return () => {
      canceled = true;
    };
  }, [user?.id, modules, courses]);

  useEffect(() => {
    if (user?.id) {
      fetchCourses();
      fetchAllCriterias();
      fetchUserRatings(user.id);
    }
  }, [user?.id, fetchCourses, fetchAllCriterias, fetchUserRatings]);

  // Aggregate real lesson counts per course using lessons service + user progress
  useEffect(() => {
    if (!modules.length || !courses.length) return;

    let canceled = false;

    const load = async () => {
      try {
        const allModuleIds = modules.map((m) => m.id);
        const { data: counts, error } = await fetchLessonCountsByModuleIds(allModuleIds);
        if (error) return;

        const map: Record<string, { totalLessons: number; completedLessons: number }> = {};

        for (const course of courses) {
          const courseModuleIds = modules.filter((m) => m.course_id === course.id).map((m) => m.id);

          const totalLessons = courseModuleIds.reduce((acc, mid) => acc + (counts[mid] ?? 0), 0);

          // completed lessons based on user progress entries (percent)
          const courseProgressEntry = useUserProgressStore
            .getState()
            .courses.find((c) => c.course_id === course.id);

          const completedLessons = (courseProgressEntry?.modules || []).reduce(
            (acc: number, m: any) => {
              const lessonsCount = counts[m.module_id] ?? 0;
              const completed = lessonsCount ? Math.round((m.progress / 100) * lessonsCount) : 0;
              return acc + completed;
            },
            0,
          );

          map[course.id] = { totalLessons, completedLessons };
        }

        if (!canceled) setLessonsCountsByCourse(map);
      } catch {
        // ignore
      }
    };

    load();
    return () => {
      canceled = true;
    };
  }, [modules, courses]);

  useEffect(() => {
    if (courses.length) {
      fetchMyModulesByCourses(courses.map((course) => course.id));
    }
  }, [courses, fetchMyModulesByCourses]);

  const getModulesCount = (courseId: string) =>
    modules.filter((m) => m.course_id === courseId).length;

  const getCompletedModulesCount = (courseId: string) => {
    const courseModules = modules.filter((m) => m.course_id === courseId);
    if (!courseModules.length) return 0;

    const completed = courseModules.reduce((acc, m) => {
      try {
        const prog = getModuleProgress(courseId, m.id);
        return acc + (prog >= 100 ? 1 : 0);
      } catch {
        return acc;
      }
    }, 0);

    return completed;
  };

  useEffect(() => {
    useAnalyticsStore.getState().trackEvent('progress_screen__load');
  }, []);

  return (
    <View style={styles.screen}>
      {coursesLoading && <Text>Завантаження курсів...</Text>}

      <ScrollView
        contentContainerStyle={[styles.scrollContent, styles.scrollContentLarge]}
        showsVerticalScrollIndicator={false}
      >
        {!coursesLoading &&
          courses.map((course) => {
            const courseSkills = skillsByCourse[course.id] ?? [];
            const courseAvgNum = (() => {
              if (!courseSkills.length) return 0;
              const total = courseSkills.reduce((sum, s) => sum + (s.average_score || 0), 0);
              return parseFloat((total / courseSkills.length).toFixed(1));
            })();
            const quizAvg = quizScores[course.id];

            return (
              <Pressable
                key={course.id}
                style={[styles.card]}
                onPress={() => {
                  analyticsStore.trackEvent('progress_screen__course__click', { id: course.id });
                  router.push({
                    pathname: '/statistics/[id]',
                    params: { id: course.id },
                  });
                }}
              >
                <View style={styles.cardRow}>
                  <Image
                    source={{ uri: course.image || 'https://picsum.photos/400/300' }}
                    style={styles.courseImage}
                  />

                  <View style={styles.cardContent}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.courseTitle}> Курс &quot;{course.title}&quot;</Text>
                      <View style={styles.scoreBubbleContainer}>
                        <View style={styles.scoreImageWrapper}>
                          <Image
                            source={require('@/src/assets/images/score-bubble-shape.png')}
                            style={styles.scoreBubbleImage}
                          />
                          <View style={styles.scoreOverlay} pointerEvents="none">
                            <Text style={styles.scoreText}>
                              {formatBubbleScore(
                                loading.skills || loading.quiz,
                                courseAvgNum,
                                quizAvg,
                              )}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.scoreLabel}>Score</Text>
                      </View>
                    </View>

                    <Text style={styles.modulesText}>{`${getCompletedModulesCount(
                      course.id,
                    )}/${getModulesCount(course.id)} modules`}</Text>

                    <View style={styles.progressRowMain}>
                      <ProgressBar percent={getCourseProgress(course.id)} height={8} />
                    </View>
                  </View>
                </View>

                {/* Course-level summary using ModuleCard component */}
                {(() => {
                  const courseProgressEntry = useUserProgressStore
                    .getState()
                    .courses.find((c) => c.course_id === (course.id as string));

                  const lessonCounts = lessonsCountsByCourse[course.id];

                  const totalLessons =
                    lessonCounts?.totalLessons ??
                    (courseProgressEntry?.modules
                      ? courseProgressEntry.modules.reduce(
                          (acc: number, m: any) =>
                            acc + (Number.isFinite(m.total_slides) ? m.total_slides : 0),
                          0,
                        )
                      : 0);

                  const completedLessons =
                    lessonCounts?.completedLessons ??
                    (courseProgressEntry?.modules
                      ? courseProgressEntry.modules.reduce((acc: number, m: any) => {
                          const ts = Number.isFinite(m.total_slides) ? m.total_slides : 0;
                          const completed = ts ? Math.round((m.progress / 100) * ts) : 0;
                          return acc + completed;
                        }, 0)
                      : 0);

                  const syntheticModule = {
                    id: course.id,
                    title: course.title,
                    description: (course as any).description ?? '',
                    course_id: course.id,
                    created_at: (course as any).created_at ?? new Date().toISOString(),
                    module_order: 0,
                  };

                  return (
                    <ModuleCard
                      key={`${course.id}-summary`}
                      module={syntheticModule}
                      skills={skillsByCourse[course.id] ?? []}
                      loadingSkills={loading.skills}
                      percent={getCourseProgress(course.id)}
                      completedSlides={completedLessons}
                      totalSlides={totalLessons}
                    />
                  );
                })()}
              </Pressable>
            );
          })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, backgroundColor: Colors.bg },
  scrollContent: { paddingBottom: 32 },
  scrollContentLarge: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  card: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    width: '100%',
    ...shadow,
  },
  courseTitle: { ...TEXT_VARIANTS.title2, marginBottom: 8 },
  /* New styles for card layout matching design */
  cardRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  courseImage: { width: 84, height: 84, borderRadius: 12, backgroundColor: '#f3f4f6' },
  cardContent: { flex: 1 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
  },
  scoreText: { ...TEXT_VARIANTS.title2 },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'RobotoCondensed',
    color: '#475569',
    marginTop: 4,
  },
  scoreBubbleImage: {
    width: 40,
    height: 40,
    overflow: 'hidden',
  },
  scoreBubbleContainer: { alignItems: 'center', marginLeft: 8 },
  scoreImageWrapper: { width: 40, height: 40, position: 'relative' },
  scoreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreTextContainer: { alignItems: 'center', marginTop: 6 },
  modulesText: { fontSize: 13, color: '#64748b', marginTop: 6, marginBottom: 6 },
  progressRowMain: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#e6e9ee',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  skillsSection: { marginTop: 8, borderTopWidth: 1, borderTopColor: '#eef2f5', paddingTop: 12 },
  skillsHeader: { ...TEXT_VARIANTS.title2, marginBottom: 8 },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skillName: { flex: 1, fontSize: 14, color: '#111827', marginRight: 12 },
  skillRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  segments: { flexDirection: 'row', gap: 6, marginRight: 8 },
  segment: { width: 22, height: 8, borderRadius: 6, backgroundColor: '#e6e9ee' },
  segmentFilled: { backgroundColor: '#4f46e5' },
  segmentEmpty: { backgroundColor: '#e6e9ee' },
  skillScore: { fontSize: 13, color: '#0f172a', fontWeight: '700' },
});
