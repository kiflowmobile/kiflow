import { courseService } from '@/src/services/courses';
import { useAuthStore, useSlidesStore, useUserProgressStore } from '@/src/stores';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, runOnJS } from 'react-native-reanimated';
import ModuleSlide from './ModuleSlide';
import { useSaveProgressOnExit } from '@/src/hooks/useSaveProgressOnExit';
import PaginationDots from './components/PaginationDot';
import {  loadProgressLocal } from '@/src/utils/progressAsyncStorage';

export default function ModuleScreen() {
  const { moduleId, courseId, slideId } = useLocalSearchParams<{
    moduleId?: string;
    courseId?: string;
    slideId?: string;
  }>();

  const { slides, isLoading, error, fetchSlidesByModule, clearError } = useSlidesStore();
  const { width, height } = useWindowDimensions();
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const router = useRouter();
  const { user } = useAuthStore();
  const totalSlides = useMemo(() => slides.length || 0, [slides]);
  const [currentSlideId, setCurrentSlideId] = useState<string | undefined>(slideId);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number | undefined>(0);

  const showPagination = useMemo(() => slides.length > 1, [slides.length]);


  const updateUrl = (id: string) => {
    router.setParams({ slideId: id });
  };

  const { setModuleProgressSafe, setCourseProgress, getModuleProgress } = useUserProgressStore();
  const lastSlideIndexRef = useRef<number>(-1);


  const handleSlideChange = useCallback(
    async (index: number) => {
      // Якщо індекс поза діапазоном
      if (index < 0 || index >= slides.length) return;
  
      // Якщо новий індекс менший або рівний поточному — не оновлюємо прогрес
      if (index <= (currentSlideIndex ?? 0)) return;
  
      setCurrentSlideId(slides[index].id);
      updateUrl(slides[index].id);
  
      if (!user || !courseId || !moduleId) return;
  
      console.log('currentSlideIndex', currentSlideIndex);
      console.log('new index', index);
  
      // ✅ Оновлюємо тільки якщо йдемо вперед
      setCurrentSlideIndex(index);
      setModuleProgressSafe(courseId, moduleId, index, slides.length, slides[index].id);
    },
    [moduleId, courseId, user?.id, slides, currentSlideIndex]
  );
  

  useSaveProgressOnExit()


  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      const index = Math.round(event.contentOffset.y / height);
      if (index !== lastSlideIndexRef.current) {
        lastSlideIndexRef.current = index;
        runOnJS(handleSlideChange)(index);
      }
    },
  });

  const goToNextSlide = () => {
    const currentIndex = slides.findIndex(s => s.id === currentSlideId);
    if (currentIndex >= 0 && currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      lastSlideIndexRef.current = nextIndex;
      scrollViewRef.current?.scrollTo({ y: nextIndex * height, animated: true });
      runOnJS(handleSlideChange)(nextIndex);
    }
  };

  useEffect(() => {
    if (!moduleId) return;
    fetchSlidesByModule(moduleId).catch(err => console.error(err));
  }, [moduleId, fetchSlidesByModule]);

  useEffect(() => {
    if (slideId && scrollViewRef.current && slides.length > 0) {
      const index = slides.findIndex(s => s.id === slideId);
      if (index >= 0) {
        scrollViewRef.current.scrollTo({
          y: index * height,
          animated: false,
        });
        setCurrentSlideId(slideId);
      }
    }
  }, [slides, height, slideId]);

  if (error) return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Помилка: {error}</Text>
      <Text style={styles.retryText} onPress={() => {
        clearError();
        if (courseId) fetchSlidesByModule(courseId);
      }}>Спробувати знову</Text>
    </View>
  );

  if (isLoading) return (
    <View style={styles.loader}>
      <ActivityIndicator size="large" />
    </View>
  );

  if (slides.length === 0) return (
    <View style={styles.loader}>
      <Text style={styles.noSlidesText}>Слайди не знайдено</Text>
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <Animated.ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={height}
        snapToAlignment="start"
        pagingEnabled
      >
        {slides.map((slide) => (
          <View key={slide.id} style={{ width, height }}>
            <ModuleSlide
              slideId={slide.id}
              isActive={currentSlideId === slide.id}
              onComplete={goToNextSlide}
              currentIndex={slides.findIndex(s => s.id === slide.id)}
              totalSlides={slides.length}
            />
          </View>
        ))}
      </Animated.ScrollView>

      {showPagination && (
      <PaginationDots
        total={slides.length}
        currentIndex={slides.findIndex(s => s.id === currentSlideId)}
      />
    )}
      
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#ff4444', textAlign: 'center', marginBottom: 10, fontSize: 16 },
  retryText: { color: '#007AFF', textAlign: 'center', textDecorationLine: 'underline', fontSize: 16 },
  noSlidesText: { color: '#666', textAlign: 'center', fontSize: 16 },
});
