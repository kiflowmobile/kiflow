import ProgressBar from '@/src/components/ui/progress-bar';
import { useModulesStore, useUserProgressStore } from '@/src/stores';
import { useCourseProgress } from '@/src/hooks/useCourseProgress';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

const DOT_SIZE = 14;
const LINE_DEFAULT = '#D9D9D9';
const LINE_COMPLETED = '#27AE60';

export default function CourseScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const {
    modules,
    isLoading,
    error,
    fetchModulesByCourse,
    clearError,
    currentModule,
    setCurrentModule,
  } = useModulesStore();

  const { getModuleProgress } = useUserProgressStore();
  const { modules: progressModules } = useCourseProgress((params.id as string) || '');

  useEffect(() => {
    if (!params.id) return;

    fetchModulesByCourse(params.id).catch((err) => {
      console.error('Unexpected error fetching modules:', err);
    });
  }, [params.id, fetchModulesByCourse]);

  const handleModulePress = (module: any) => {
    setCurrentModule(module);
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

    let dotStyle = styles.statusDotNotStarted;
    if (isCompleted) {
      dotStyle = styles.statusDotCompleted;
    } else if (isCurrent) {
      dotStyle = styles.statusDotCurrent;
    }

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
      <Pressable style={styles.moduleItem} onPress={() => handleModulePress(item)}>
        <View style={styles.statusDotWrapper}>
          <View style={styles.lineContainer}>
            {!isFirst ? (
              <View style={[styles.lineSegment, { backgroundColor: topLineColor }]} />
            ) : (
              <View style={[styles.lineSegment, { backgroundColor: 'transparent' }]} />
            )}

            <View style={styles.dotHolder}>
              <View style={[styles.statusDot, dotStyle]} />
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
        {params.id ? (
          <>
            <Text style={styles.progressText}>{progress}%</Text>
            <View style={styles.progressBarWrapper}>
              <ProgressBar percent={progress} />
            </View>
          </>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
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
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },

  moduleItem: {
    position: 'relative',
    padding: 16,
    marginBottom: 12,
    marginLeft: 28, // чтобы таймлайн был снаружи
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  statusDotWrapper: {
    position: 'absolute',
    left: -32,
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
    backgroundColor: '#C4C4C4',
  },

  statusDotNotStarted: {
    backgroundColor: '#C4C4C4',
  },
  statusDotCompleted: {
    backgroundColor: '#27AE60',
  },
  statusDotCurrent: {
    backgroundColor: '#000',
  },

  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 14,
    color: '#444',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginBottom: 6,
  },
  progressBarWrapper: {
    marginBottom: 6,
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
