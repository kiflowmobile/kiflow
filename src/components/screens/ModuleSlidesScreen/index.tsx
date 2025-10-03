import { courseService } from '@/src/services/courses';
import { useAuthStore, useCourseStore, useModulesStore, useSlidesStore, useUserProgressStore } from '@/src/stores';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import CourseSwiper from '../CourseScreen/CourseSwiper';
import { useRoute } from '@react-navigation/native';

export default function ModuleSlidesScreen() {
  const params = useLocalSearchParams<{ id?: string; courseId?: string; slideId?:string}>(); 
  const { 
    slides, 
    isLoading, 
    error, 
    fetchSlidesByModule, 
    clearError 
  } = useSlidesStore();
  const { setModuleProgressSafe } = useUserProgressStore();
  const { user } = useAuthStore();
  const { fetchCourseById } = useCourseStore.getState();
  const { fetchModulesByCourse, getModule, setCurrentModule} = useModulesStore.getState();
  const totalSlides = useMemo(() => slides.length || 0, [slides]);
  const router = useRoute();




    const lastIndexRef = useRef<number | null>(null);

    const handleIndexChange = useCallback(async (index: number) => {
      if (lastIndexRef.current === index) return;
      lastIndexRef.current = index;
      if (!params.id || totalSlides === 0) return;
    
      const percent = Math.round(((index + 1) / totalSlides) * 100);
    
      // --- оновлюємо локально у Zustand ---
      setModuleProgressSafe(params.id, percent).catch(console.error);
    
      // --- оновлюємо progress і last_slide_id у БД ---
      if (user?.id && params.courseId && slides[index]?.id) {
        try {
          const slideId = slides[index].id;
    
          await courseService.updateLastSlideId(user.id, params.courseId, slideId);
          await courseService.updateCourseProgress(user.id, params.courseId, percent);


          console.log('slideId',slideId)
    
          // --- оновлюємо URL без перезавантаження ---
          router.replace({
            pathname: `/module/${params.id}`,
            params: { courseId: params.courseId, slideId },
          });
        } catch (error) {
          console.warn('Failed to update course progress or last slide id:', error);
        }
      }
    }, [params.id, params.courseId,user?.id, totalSlides, slides]);
    
    
    

  // useEffect(() => {
  //   if (!params.courseId) return;

  //   fetchCourseById(params.courseId).catch((err) => {
  //     console.error('❌ Error fetching course:', err);
  //   });

  //   fetchModulesByCourse(params.courseId)
  //   .then(() => {
  //     if (params.id) {
  //       const module = getModule(params.id);
  //       setCurrentModule(module); 
  //     }
  //   })
  //   .catch(console.error);
  // }, [params.courseId]);


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