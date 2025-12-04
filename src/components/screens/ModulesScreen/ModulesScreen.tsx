import ProgressBar from '@/src/components/ui/progress-bar';
import { useModulesStore, useUserProgressStore, useCourseStore } from '@/src/stores';
import { useCourseProgress } from '@/src/hooks/useCourseProgress';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import { Colors } from '@/src/constants/Colors';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';
import { fetchLessonCountsByModuleIds } from '@/src/services/lessons';

const DOT_SIZE = 24;
const LINE_DEFAULT = '#D9D9D9';
const LINE_COMPLETED = Colors.green;

export default function CourseScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const analyticsStore = useAnalyticsStore.getState();

  const {
    modules,
    isLoading,
    error,
    fetchModulesByCourse,
    clearError,
    currentModule,
    setCurrentModule,
  } = useModulesStore();

  const { currentCourse, fetchCourseById } = useCourseStore();

  const { getModuleProgress } = useUserProgressStore();
  const { modules: progressModules } = useCourseProgress((params.id as string) || '');

  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!params.id) return;
    fetchCourseById(params.id).catch((err) => {
      console.error('Unexpected error fetching course:', err);
    });

    fetchModulesByCourse(params.id).catch((err) => {
      console.error('Unexpected error fetching modules:', err);
    });
  }, [params.id, fetchModulesByCourse, fetchCourseById]);

  const handleModulePress = (module: any, index: number, progress: number) => {
    setCurrentModule(module);
    analyticsStore.trackEvent('modules_screen__module__click', {
      id: module.id,
      index,
      progress,
    });
    const progressEntry = progressModules?.find((m) => m.module_id === module.id);
    const slideId = progressEntry?.last_slide_id || undefined;
    router.push({
      pathname: '/module/[moduleId]',
      params: {
        moduleId: module.id,
        courseId: params.id,
        ...(slideId ? { slideId } : {}),
      },
    });
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const progress = params.id ? getModuleProgress(params.id, item.id) : 0;

    const isCurrent = currentModule?.id === item.id;
    const isCompleted = progress >= 100;

    const isFirst = index === 0;
    const isLast = index === modules.length - 1;

    let topLineColor = LINE_DEFAULT;
    if (!isFirst && params.id) {
      const prevModule = modules[index - 1];
      const prevProgress = getModuleProgress(params.id, prevModule.id);
      if (prevProgress >= 100) {
        topLineColor = LINE_COMPLETED;
      }
    }

    const bottomLineColor = isCompleted ? LINE_COMPLETED : LINE_DEFAULT;

    return (
      <Pressable style={styles.moduleItem} onPress={() => handleModulePress(item, index, progress)}>
        <View style={styles.statusDotWrapper}>
          <View style={styles.lineContainer}>
            {!isFirst ? (
              <View style={[styles.lineSegment, { backgroundColor: topLineColor }]} />
            ) : (
              <View style={[styles.lineSegment, { backgroundColor: 'transparent' }]} />
            )}

            <View style={styles.dotHolder}>
              {isCompleted ? (
                <View style={[styles.statusDot, styles.statusDotCompleted]}>
                  <Text style={styles.checkmark} allowFontScaling={false}>
                    ✓
                  </Text>
                </View>
              ) : isCurrent ? (
                <View style={[styles.statusDot, styles.statusDotCurrent]}>
                  <View style={styles.statusDotCurrentInner} />
                </View>
              ) : (
                <View style={[styles.statusDot, styles.statusDotNotStarted]} />
              )}
            </View>

            {!isLast ? (
              <View style={[styles.lineSegment, { backgroundColor: bottomLineColor }]} />
            ) : (
              <View style={[styles.lineSegment, { backgroundColor: 'transparent' }]} />
            )}
          </View>
        </View>

        <Text style={styles.moduleTitle}>{item.title}</Text>
        {item.description ? <Text style={styles.moduleDescription}>{item.description}</Text> : null}

        {/* lessons count badge */}
        <View style={styles.lessonsBadge} pointerEvents="none">
          <Text style={styles.lessonsBadgeText} allowFontScaling={false}>
            {`${lessonCounts[item.id] ?? 0} lessons`}
          </Text>
        </View>
        {params.id ? (
          <>
            <View style={styles.progressBarWrapper}>
              <ProgressBar percent={progress} />
            </View>
          </>
        ) : null}
      </Pressable>
    );
  };

  useEffect(() => {
    analyticsStore.trackEvent('modules_screen__load');
  }, [analyticsStore]);

  useEffect(() => {
    if (!modules || modules.length === 0) return;

    let mounted = true;

    (async () => {
      try {
        const ids = modules.map((m: any) => m.id);
        const res: any = await fetchLessonCountsByModuleIds(ids);
        if (mounted) setLessonCounts(res?.data || {});
      } catch {
      }
    })();

    return () => {
      mounted = false;
    };
  }, [modules]);

  return (
    <View style={styles.container}>
      {/* Заголовок курсу */}
      {currentCourse?.title ? (
        <Text style={styles.courseTitle} numberOfLines={2} ellipsizeMode="tail">
          Курс &quot;{currentCourse.title}&quot;
        </Text>
      ) : null}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Помилка: {error}</Text>
          <Text
            style={styles.retryText}
            onPress={() => {
              clearError();
              if (params.id) {
                fetchModulesByCourse(params.id);
              }
            }}
          >
            Спробувати знову
          </Text>
        </View>
      ) : isLoading ? (
        <Text style={styles.loadingText}>Завантаження модулів...</Text>
      ) : modules.length === 0 ? (
        <Text style={styles.loadingText}>Модулі не знайдено</Text>
      ) : (
        <FlatList
          data={modules}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, padding: 16 },

  moduleItem: {
    position: 'relative',
    padding: 16,
    marginBottom: 12,
    marginLeft: 28,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.05)',
  },
  statusDotWrapper: {
    position: 'absolute',
    left: -28,
    top: 0,
    bottom: 0,
    width: 24,
  },

  lineContainer: {
    flex: 1,
    alignItems: 'center',
  },

  lineSegment: {
    width: 2,
    flex: 1,
    marginBottom: -12,
    borderRadius: 1,
  },

  dotHolder: {
    height: DOT_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },

  statusDot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusDotNotStarted: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#D9D9D9',
  },

  statusDotCompleted: {
    backgroundColor: Colors.green,
  },
  checkmark: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  statusDotCurrent: {
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#000',
  },
  statusDotCurrentInner: {
    width: DOT_SIZE * 0.4,
    height: DOT_SIZE * 0.4,
    borderRadius: (DOT_SIZE * 0.4) / 2,
    backgroundColor: '#000',
  },

  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  courseTitle: {
    ...TEXT_VARIANTS.title2,
    marginBottom: 16,
  },
  moduleDescription: {
    marginTop: 8,
    color: '#525252',
    ...TEXT_VARIANTS.body2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginBottom: 6,
  },
  progressBarWrapper: {
    marginBottom: 6,
    marginTop: 12,
  },

  lessonsBadge: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: Colors.blue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonsBadgeText: {
    color: Colors.white,
    fontSize: 14,
    fontFamily: 'RobotoCondensed',
    fontWeight: '600',
  },

  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryText: {
    color: '#007AFF',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
