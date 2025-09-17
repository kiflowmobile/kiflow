
import { updateLastSlideId } from '@/src/services/courses';
import { useAuthStore, useSlidesStore, useUserProgressStore } from '@/src/stores';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import CourseSwiper from '../CourseScreen/CourseSwiper';

export default function ModuleSlidesScreen() {
  const params = useLocalSearchParams<{ id?: string; courseId?: string }>(); // id модуля и courseId
  const { 
    slides, 
    isLoading, 
    error, 
    fetchSlidesByModule, 
    clearError 
  } = useSlidesStore();
  const { setModuleProgress } = useUserProgressStore();
  const { user } = useAuthStore();

  const totalSlides = useMemo(() => slides.length || 0, [slides]);

  useEffect(() => {
    if (!params.id) return;

    fetchSlidesByModule(params.id).catch(err => {
      console.error('Unexpected error fetching slides:', err);
    });
  }, [params.id, fetchSlidesByModule]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Помилка: {error}</Text>
        <Text style={styles.retryText} onPress={() => {
          clearError();
          if (params.id) {
            fetchSlidesByModule(params.id);
          }
        }}>
          Спробувати знову
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (slides.length === 0) {
    return (
      <View style={styles.loader}>
        <Text style={styles.noSlidesText}>Слайди не знайдено</Text>
      </View>
    );
  }

  // Обновляем прогресс при смене индекса в CourseSwiper через callback
  const handleIndexChange = (index: number) => {
    if (!params.id || totalSlides === 0) return;
    
    // Обновляем прогресс модуля
    const percent = Math.round(((index + 1) / totalSlides) * 100);
    setModuleProgress(params.id, percent).catch(() => {});
    
    // Обновляем last_slide_id если есть пользователь, courseId и текущий слайд
    if (user?.id && params.courseId && slides[index]?.id) {
      updateLastSlideId(user.id, params.courseId, slides[index].id).catch((error) => {
        console.warn('Failed to update last slide id:', error);
      });
    }
  };

  return <CourseSwiper onIndexChange={handleIndexChange} />;
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16,
  },
  retryText: {
    color: '#007AFF',
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontSize: 16,
  },
  noSlidesText: {
    color: '#666',
    textAlign: 'center',
    fontSize: 16,
  },
});
