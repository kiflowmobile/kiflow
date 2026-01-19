import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { useAnimatedScrollHandler, runOnJS } from 'react-native-reanimated';

import { useAuth } from '@/features/auth';
import { LessonSlide } from '@/features/lessons/components/lesson';
import { useLessons, useSlides } from '@/features/lessons';
import { useUserProgress } from '@/features/progress';
import { useSkillRatings } from '@/features/statistics';
import { useAnalytics } from '@/features/analytics';
import { PaginationDots } from './pagination-dot';
import { useLastSlideEmail } from '../hooks/useLastSlideEmail';

function useSaveProgressOnLeave() {
  const { syncProgressToDB } = useUserProgress();

  useEffect(() => {
    return () => {
      syncProgressToDB().catch((err) => console.error('Error syncing progress on leave:', err));
    };
  }, [syncProgressToDB]);
}

export function ModuleScreen() {
  const { moduleId, courseId, slideId } = useLocalSearchParams<{
    moduleId?: string;
    courseId?: string;
    slideId?: string;
  }>();

  const {
    lessons,
    isLoading: isLoadingLessons,
    error: errorLessons,
    fetchLessonsByModule,
  } = useLessons();
  const { slides, isLoading, error, fetchSlidesByLessons } = useSlides();
  const router = useRouter();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  const { average, skills, fetchAverage, fetchSkills } = useSkillRatings();
  const { setModuleProgressSafe } = useUserProgress();

  const lastScrollIndexRef = useRef<number>(-1);
  const lastSavedIndexRef = useRef<number>(-1);
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  const [currentSlideId, setCurrentSlideId] = useState<string | undefined>(slideId);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const { width, height } = useWindowDimensions();

  function getInitialPageHeight() {
    if (Platform.OS === 'web') {
      const h = window.innerHeight || document.documentElement.clientHeight || 0;
      return h;
    }
    const { height: screenH } = Dimensions.get('screen');
    return screenH;
  }

  const stablePageHeightRef = useRef<number>(getInitialPageHeight());
  const [pageH, setPageH] = useState<number>(stablePageHeightRef.current);

  const showPagination = useMemo(() => slides.length > 1, [slides.length]);

  const updateUrl = useCallback(
    (id: string) => {
      router.setParams({ slideId: id });
    },
    [router],
  );

  useEffect(() => {
    if (!moduleId) return;
    fetchLessonsByModule(moduleId).catch((err) => console.error(err));
  }, [moduleId, fetchLessonsByModule]);

  useEffect(() => {
    if (lessons.length === 0) return;
    fetchSlidesByLessons(lessons);
  }, [lessons, fetchSlidesByLessons]);

  useEffect(() => {
    if (height > stablePageHeightRef.current) {
      stablePageHeightRef.current = height;
      setPageH(height);
    }
  }, [height, width]);

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

  useEffect(() => {
    if (!user?.id || !moduleId) return;

    fetchAverage(user.id, moduleId);
    fetchSkills(user.id, moduleId);
  }, [user?.id, moduleId, fetchAverage, fetchSkills]);

  const handleSlideChange = useCallback(
    async (index: number) => {
      if (index < 0 || index >= slides.length) return;

      setCurrentSlideId(slides[index].id);
      updateUrl(slides[index].id);

      if (!user || !courseId || !moduleId) return;

      if (index > lastSavedIndexRef.current) {
        await setModuleProgressSafe(courseId, moduleId, index, slides.length, slides[index].id);
        lastSavedIndexRef.current = index;
      }
    },
    [moduleId, courseId, user, slides, updateUrl, setModuleProgressSafe],
  );

  useEffect(() => {
    if (!moduleId || slides.length === 0) return;

    const index = slides.findIndex((s) => s.id === slideId);
    const currentIndex = index >= 0 ? index : 0;

    trackEvent('course_screen__load', {
      id: moduleId,
      index: currentIndex,
      pages: slides.length,
    });
  }, [moduleId, slides, slideId, trackEvent]);

  useSaveProgressOnLeave();

  useEffect(() => {
    if (slides.length === 0) return;
    if (slideId) return;
    const firstSlide = slides[0];
    setCurrentSlideId(firstSlide.id);
    setTimeout(() => {
      router.setParams({ slideId: firstSlide.id });
    }, 0);
  }, [slides, slideId, router]);

  const { triggerEmail } = useLastSlideEmail({
    user,
    moduleId,
    courseId,
    average,
    skills,
  });

  const triggerLastSlideEmail = useCallback(
    (index: number) => {
      triggerEmail(index, slides);
    },
    [triggerEmail, slides],
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const index = Math.round(event.contentOffset.y / pageH);
      if (index !== lastScrollIndexRef.current) {
        lastScrollIndexRef.current = index;
        runOnJS(handleSlideChange)(index);
        runOnJS(triggerLastSlideEmail)(index);
      }
    },
  });

  const goToNextSlide = useCallback(async () => {
    console.log('[ModuleScreen] goToNextSlide called, currentSlideId=', currentSlideId);
    const currentIndex = slides.findIndex((s) => s.id === currentSlideId);
    if (currentIndex < 0) return;

    const nextIndex = currentIndex + 1;
    if (nextIndex >= slides.length) return;

    scrollViewRef.current?.scrollTo({ y: nextIndex * pageH, animated: true });
    await handleSlideChange(nextIndex);
  }, [currentSlideId, slides, pageH, handleSlideChange]);

  useEffect(() => {
    if (slideId && scrollViewRef.current && slides.length > 0) {
      const index = slides.findIndex((s) => s.id === slideId);
      if (index >= 0) {
        scrollViewRef.current.scrollTo({
          y: index * pageH,
          animated: false,
        });
        setCurrentSlideId(slideId);
      }
    }
  }, [slides, pageH, slideId]);

  if (error || errorLessons)
    return (
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-red-500 text-center mb-2.5 text-base">Помилка: {error}</Text>
        <Text
          className="text-blue-500 text-center underline text-base"
          onPress={() => {
            // clearError();
            // if (moduleId) fetchSlidesByModule(moduleId);
          }}
        >
          Спробувати знову
        </Text>
      </View>
    );

  if (isLoading || isLoadingLessons)
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );

  if (slides.length === 0)
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-600 text-center text-base">Слайди не знайдено</Text>
      </View>
    );

  return (
    <View className="flex-1">
      <Animated.ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={pageH}
        snapToAlignment="start"
        pagingEnabled
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEnabled={scrollEnabled}
        contentContainerStyle={{ minHeight: pageH * Math.max(slides.length, 1) }}
      >
        {slides.map((slide, i) => (
          <View key={slide.id} style={{ width, height: pageH }}>
            <LessonSlide
              slideId={slide.id}
              isActive={currentSlideId === slide.id}
              onComplete={goToNextSlide}
              currentIndex={i}
              totalSlides={slides.length}
              setScrollEnabled={setScrollEnabled}
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
