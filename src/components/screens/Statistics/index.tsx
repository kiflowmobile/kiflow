import { useEffect } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useCourseStore } from '@/src/stores/courseStore';
import { useCriteriaStore } from '@/src/stores/criterias';
import { useMainRatingStore } from '@/src/stores/mainRatingStore';
import { useAuthStore, useModulesStore, useUserProgressStore } from '@/src/stores';
import { useRouter } from 'expo-router';
import { shadow } from '../../ui/styles/shadow';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import { Colors } from '@/src/constants/Colors';
import ProgressBar from '@/src/components/ui/progress-bar';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';

export default function StatisticsScreen() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;
  const isXLargeScreen = width >= 1024;

  const { courses, fetchCourses, isLoading: coursesLoading } = useCourseStore();
  const { criterias, fetchAllCriterias } = useCriteriaStore();
  const { fetchUserRatings, ratings } = useMainRatingStore();
  const { modules, fetchMyModulesByCourses } = useModulesStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const analyticsStore = useAnalyticsStore.getState();

  const { getCourseProgress, getModuleProgress } = useUserProgressStore();

  useEffect(() => {
    if (user?.id) {
      fetchCourses();
      fetchAllCriterias();
      fetchUserRatings(user.id);
    }
  }, [user?.id, fetchCourses, fetchAllCriterias, fetchUserRatings]);

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

  const getCourseAverageFromRatings = (courseId: string) => {
    const { criterias: storeCriterias } = useCriteriaStore.getState();
    const { ratings: storeRatings } = useMainRatingStore.getState();

    const courseCriterias = storeCriterias.filter((c) => c.course_id === courseId);

    if (!courseCriterias.length) {
      return '0.0';
    }

    const courseRatings = storeRatings
      .filter((r) => courseCriterias.some((c) => c.key === r.criteria_key) && r.rating != null)
      .map((r) => ({ ...r, rating: Number(r.rating) }))
      .filter((r) => Number.isFinite(r.rating));

    if (!courseRatings.length) {
      return '0.0';
    }

    const avg = courseRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / courseRatings.length;
    return avg.toFixed(1);
  };

  useEffect(() => {
    useAnalyticsStore.getState().trackEvent('progress_screen__load');
  }, []);

  return (
    <View style={styles.screen}>
      {coursesLoading && <Text>Завантаження курсів...</Text>}

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isLargeScreen && styles.scrollContentLarge]}
        showsVerticalScrollIndicator={false}
      >
        {!coursesLoading &&
          courses.map((course) => (
            <Pressable
              key={course.id}
              style={[
                styles.card,
                isLargeScreen && styles.cardLarge,
                isXLargeScreen && styles.cardXLarge,
              ]}
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
                            {getCourseAverageFromRatings(course.id)}
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

                  <View style={styles.skillsSection}>
                    <Text style={styles.skillsHeader}>Skills level</Text>

                    {criterias
                      .filter((c) => c.course_id === course.id)
                      .slice(0, 4)
                      .map((item) => {
                        const skill = ratings.find((s) => s.criteria_key === item.key);
                        const score = Math.round(skill?.rating ?? 0);
                        return (
                          <View key={item.id} style={styles.skillRow}>
                            <Text style={styles.skillName} numberOfLines={2}>
                              {item.name}
                            </Text>
                            <View style={styles.skillRight}>
                              <View style={styles.segments}>
                                {Array.from({ length: 5 }).map((_, idx) => (
                                  <View
                                    key={idx}
                                    style={[
                                      styles.segment,
                                      idx < score ? styles.segmentFilled : styles.segmentEmpty,
                                    ]}
                                  />
                                ))}
                              </View>
                              <Text style={styles.skillScore}>{`${skill?.rating ?? 0}/5`}</Text>
                            </View>
                          </View>
                        );
                      })}
                  </View>
                </View>
              </View>
            </Pressable>
          ))}
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
  cardLarge: { width: '45%', margin: 8 },
  cardXLarge: { width: '30%' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: { fontSize: 13, color: '#475569', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700' },
  courseTitle: { ...TEXT_VARIANTS.title2, marginBottom: 8 },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 0,
  },
  tableCell: { flex: 1, fontSize: 14, color: '#334155' },
  tableHeaderText: { fontWeight: '700', color: '#0f172a' },
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
  /* wrapper to position image and overlay */
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
  progressFill: { height: '100%', backgroundColor: '#16a34a' },
  progressPercent: { width: 44, textAlign: 'right', fontWeight: '700', color: '#0f172a' },
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
