
import { updateLastSlideId } from '@/src/services/courses';
import { sendLastSlideEmail } from '@/src/services/emailService';
import { useAuthStore, useCourseStore, useModulesStore, useSlidesStore, useUserProgressStore } from '@/src/stores';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import CourseSwiper from '../CourseScreen/CourseSwiper';

export default function ModuleSlidesScreen() {
  const params = useLocalSearchParams<{ id?: string; courseId?: string }>(); 
  const { 
    slides, 
    isLoading, 
    error, 
    fetchSlidesByModule, 
    clearError 
  } = useSlidesStore();
  const { setModuleProgressSafe } = useUserProgressStore();
  const { user } = useAuthStore();
  const { fetchCourseById, currentCourse } = useCourseStore.getState();
  const { fetchModulesByCourse, getModule, setCurrentModule, currentModule} = useModulesStore.getState();
  const totalSlides = useMemo(() => slides.length || 0, [slides]);


    const lastIndexRef = useRef<number | null>(null);

    const handleIndexChange = useCallback(async (index: number) => {
      if (lastIndexRef.current === index) return; 
      lastIndexRef.current = index;
      if (!params.id || totalSlides === 0) return;
        
        const percent = Math.round(((index + 1) / totalSlides) * 100);
        setModuleProgressSafe(params.id, percent).catch(() => {});
        
        if (user?.id && params.courseId && slides[index]?.id) {
          updateLastSlideId(user.id, params.courseId, slides[index].id).catch((error) => {
            console.warn('Failed to update last slide id:', error);
          });
        }

        // Проверяем, является ли это последним слайдом модуля
        if (index === totalSlides - 1 && user?.email && slides[index]) {
          try {
            await sendLastSlideEmail({
              userEmail: user.email,
              moduleTitle: currentModule?.title || 'Неизвестный модуль',
              slide: slides[index],
              courseTitle: currentCourse?.title,
              userId: user.id,
              moduleId: params.id
            });
            console.log('Email sent successfully for last slide');
          } catch (error) {
            console.warn('Failed to send email for last slide:', error);
          }
        }
    }, [params.id, params.courseId, user?.id, user?.email, totalSlides, slides, currentModule, currentCourse]);
    
    

  useEffect(() => {
    if (!params.courseId) return;

    fetchCourseById(params.courseId).catch((err) => {
      console.error('❌ Error fetching course:', err);
    });

    fetchModulesByCourse(params.courseId)
    .then(() => {
      if (params.id) {
        const module = getModule(params.id);
        setCurrentModule(module); 
      }
    })
    .catch(console.error);
  }, [params.courseId]);


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