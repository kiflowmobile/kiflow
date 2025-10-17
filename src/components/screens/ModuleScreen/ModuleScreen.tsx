import { useAuthStore, useSlidesStore, useUserProgressStore } from '@/src/stores';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { useAnimatedScrollHandler, runOnJS } from 'react-native-reanimated';
import ModuleSlide from './ModuleSlide';
import { useSaveProgressOnExit } from '@/src/hooks/useSaveProgressOnExit';
import PaginationDots from './components/PaginationDot';

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

  const stablePageHeightRef = useRef<number>(getInitialPageHeight());
  const [pageH, setPageH] = useState<number>(stablePageHeightRef.current);

  function getInitialPageHeight() {
    if (Platform.OS === 'web') {
      const h = window.innerHeight || document.documentElement.clientHeight || 0;
      return h;
    }
    const { height: screenH } = Dimensions.get('screen');
    return screenH;
  }

  useEffect(() => {
    if (height > stablePageHeightRef.current) {
      stablePageHeightRef.current = height;
      setPageH(height);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, width]);

  const [currentSlideId, setCurrentSlideId] = useState<string | undefined>(slideId);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number | undefined>(0);

  const showPagination = useMemo(() => slides.length > 1, [slides.length]);

  const updateUrl = (id: string) => {
    router.setParams({ slideId: id });
  };

  const { setModuleProgressSafe } = useUserProgressStore();
  const lastScrollIndexRef = useRef<number>(-1);
  const lastSavedIndexRef = useRef<number>(-1);

  const [scrollEnabled, setScrollEnabled] = useState(true);
  useEffect(() => {
    if (Platform.OS === 'web') {
      const onFocus = (e: FocusEvent) => {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.getAttribute('contenteditable') === 'true')
        ) {
          setScrollEnabled(false);
        }
      };
      const onBlur = (e: FocusEvent) => {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.getAttribute('contenteditable') === 'true')
        ) {
          setScrollEnabled(true);
        }
      };
      window.addEventListener('focusin', onFocus);
      window.addEventListener('focusout', onBlur);
      return () => {
        window.removeEventListener('focusin', onFocus);
        window.removeEventListener('focusout', onBlur);
      };
    }
  }, []);

  const handleSlideChange = useCallback(
    async (index: number) => {
      if (index < 0 || index >= slides.length) return;

      setCurrentSlideId(slides[index].id);
      setCurrentSlideIndex(index);
      updateUrl(slides[index].id);

      if (!user || !courseId || !moduleId) return;

      if (index > lastSavedIndexRef.current) {
        await setModuleProgressSafe(courseId, moduleId, index, slides.length, slides[index].id);
        lastSavedIndexRef.current = index;
      }
    },
    [moduleId, courseId, user?.id, slides],
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const index = Math.round(event.contentOffset.y / pageH);
      if (index !== lastScrollIndexRef.current) {
        lastScrollIndexRef.current = index;
        runOnJS(handleSlideChange)(index);
      }
    },
  });

  useSaveProgressOnExit();

  useEffect(() => {
    if (slides.length > 0 && !currentSlideId) {
      const firstSlide = slides[0];
      setCurrentSlideId(firstSlide.id);
      setCurrentSlideIndex(0);
      updateUrl(firstSlide.id);
    }
  }, [slides, currentSlideId]);

  const goToNextSlide = () => {
    const currentIndex = slides.findIndex((s) => s.id === currentSlideId);
    if (currentIndex >= 0 && currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({ y: nextIndex * pageH, animated: true });
      handleSlideChange(nextIndex);
    }
  };

  useEffect(() => {
    if (!moduleId) return;
    fetchSlidesByModule(moduleId).catch((err) => console.error(err));
  }, [moduleId, fetchSlidesByModule]);

  useEffect(() => {
    if (slideId && scrollViewRef.current && slides.length > 0) {
      const index = slides.findIndex((s) => s.id === slideId);
      if (index >= 0) {
        scrollViewRef.current.scrollTo({
          y: index * pageH,
          animated: false,
        });
        setCurrentSlideId(slideId);
        setCurrentSlideIndex(index);
      }
    }
  }, [slides, pageH, slideId]);

  if (error)
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Помилка: {error}</Text>
        <Text
          style={styles.retryText}
          onPress={() => {
            clearError();
            if (moduleId) fetchSlidesByModule(moduleId);
          }}
        >
          Спробувати знову
        </Text>
      </View>
    );

  if (isLoading)
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );

  if (slides.length === 0)
    return (
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
        snapToInterval={pageH}
        snapToAlignment="start"
        pagingEnabled
        // quality-of-life для инпутов
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEnabled={scrollEnabled}
        contentContainerStyle={{ minHeight: pageH * Math.max(slides.length, 1) }}
      >
        {slides.map((slide, i) => (
          <View key={slide.id} style={{ width, height: pageH }}>
            <ModuleSlide
              slideId={slide.id}
              isActive={currentSlideId === slide.id}
              onComplete={goToNextSlide}
              currentIndex={i}
              totalSlides={slides.length}
            />
          </View>
        ))}
      </Animated.ScrollView>

      {showPagination && (
        <PaginationDots
          total={slides.length}
          currentIndex={Math.max(
            slides.findIndex((s) => s.id === currentSlideId),
            0,
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#ff4444', textAlign: 'center', marginBottom: 10, fontSize: 16 },
  retryText: {
    color: '#007AFF',
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontSize: 16,
  },
  noSlidesText: { color: '#666', textAlign: 'center', fontSize: 16 },
});
