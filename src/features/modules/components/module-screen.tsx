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
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuthStore } from '@/features/auth';
import { useCourseStore } from '@/features/courses';
import { LessonSlide, useLessonsStore, useSlidesStore } from '@/features/lessons';
import { useModulesStore } from '@/features/modules';
import { useUserProgressStore } from '@/features/progress';
import { useMainRatingStore } from '@/features/statistics';
import { useAnalytics } from '@/features/analytics';
import PaginationDots from './pagination-dot';

// Helper function to send last slide email
async function sendLastSlideEmail(emailData: {
  userId: string;
  userEmail: string;
  moduleId?: string;
  moduleTitle: string;
  courseTitle?: string;
  slide: any;
  averageScore?: number;
  skills?: any[];
  quizScore?: number;
  userName?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/email/send-last-slide', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

// Hook to save progress on leave
function useSaveProgressOnLeave() {
  const syncProgressToDB = useUserProgressStore((state) => state.syncProgressToDB);

  useEffect(() => {
    return () => {
      // Sync progress to DB when component unmounts
      syncProgressToDB().catch((err) => console.error('Error syncing progress on leave:', err));
    };
  }, [syncProgressToDB]);
}

function dedupeClientSkills(rawSkills: any[] | undefined) {
  if (!Array.isArray(rawSkills)) return [];

  const seen = new Set<string>();
  const result: any[] = [];

  for (const skill of rawSkills) {
    const id = (skill.criterion_key || skill.criterion_id || skill.key || skill.name || '')
      .toString()
      .trim()
      .toLowerCase();

    if (!id) {
      result.push(skill);
      continue;
    }

    if (seen.has(id)) continue;

    seen.add(id);
    result.push(skill);
  }

  return result;
}
  
export function ModuleScreen() {
  const { moduleId, courseId, slideId } = useLocalSearchParams<{
    moduleId?: string;
    courseId?: string;
    slideId?: string;
  }>();

  const { lessons, isLoadingModule, errorModule, fetchLessonByModule } = useLessonsStore();
  const { slides, isLoading, error, fetchSlidesByLessons } = useSlidesStore();
  const router = useRouter();
  const { user } = useAuthStore();
  const { trackEvent } = useAnalytics();
  const { average, skills, fetchAverage, fetchSkills } = useMainRatingStore();
  const { setModuleProgressSafe } = useUserProgressStore();

  const emailSentRef = useRef(false);
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
    fetchLessonByModule(moduleId).catch((err) => console.error(err));
  }, [moduleId, fetchLessonByModule]);

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

  const triggerLastSlideEmail = useCallback(
      async (index: number) => {
        const isLastSlide = index === slides.length - 1;
        const currentSlide = slides[index];
  
        if (!isLastSlide || emailSentRef.current || !user?.email || !currentSlide) {
          return;
        }
  
        emailSentRef.current = true;
  
        try {
          const modulesState = useModulesStore.getState();
          const coursesState = useCourseStore.getState();
  
          const resolvedModuleTitle =
            (modulesState.currentModule &&
              modulesState.currentModule.id === moduleId &&
              modulesState.currentModule.title) ||
            (moduleId ? modulesState.getModule(moduleId)?.title : undefined) ||
            currentSlide.slide_title ||
            'Модуль без назви';
  
          const resolvedCourseTitle =
            (coursesState.currentCourse &&
              coursesState.currentCourse.id === courseId &&
              coursesState.currentCourse.title) ||
            (courseId
              ? coursesState.courses.find((course) => course.id === courseId)?.title
              : undefined);
  
          const uniqueSkills = dedupeClientSkills(skills);
  
          console.log('[ModuleScreen] sendLastSlideEmail payload will be:', {
            userId: user.id,
            userEmail: user.email,
            courseId,
            moduleId,
            averageScore: average,
            skillsCountRaw: Array.isArray(skills) ? skills.length : 0,
            skillsCountUnique: uniqueSkills.length,
            moduleTitle: resolvedModuleTitle,
            courseTitle: resolvedCourseTitle,
            slideId: currentSlide.id,
          });
  
          const emailData = {
            userId: user.id,
            userName:
              (user?.user_metadata &&
                (user.user_metadata.full_name || user.user_metadata.first_name)) ||
              user.email ||
              undefined,
            userEmail: user.email,
            moduleId,
            moduleTitle: resolvedModuleTitle,
            courseTitle: resolvedCourseTitle,
            slide: currentSlide,
            averageScore: average ?? undefined,
            skills: uniqueSkills,
          };
  
          try {
            if (courseId) {
              const key = `quiz-progress-${courseId}`;
              const stored = await AsyncStorage.getItem(key);
              if (stored) {
                const parsed = JSON.parse(stored);
                const entries = Object.values(parsed || {});
                if (Array.isArray(entries)) {
                  const total = entries.length;
                  if (total > 0) {
                    const correct = entries.filter(
                      (q: any) => q.selectedAnswer === q.correctAnswer,
                    ).length;
                    const rating = (correct / total) * 5;
                    (emailData as any).quizScore = Math.round(rating * 10) / 10;
                  }
                }
              }
            }
          } catch (e) {
            console.warn('[ModuleScreen] Failed to read quiz progress for email payload', e);
          }
  
          const result = await sendLastSlideEmail(emailData);
          if (!result.success) {
            console.error('Failed to send last slide email:', result.error);
          }
        } catch (e) {
          console.error('Error sending last slide email', e);
        }
      },
      [average, courseId, moduleId, skills, slides, user],
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

  if (error || errorModule)
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

    if (isLoading || isLoadingModule)
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