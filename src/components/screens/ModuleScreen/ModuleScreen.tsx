import {
  useAuthStore,
  useCourseStore,
  useMainRatingStore,
  useModulesStore,
  useSlidesStore,
  useUserProgressStore,
} from '@/src/stores';
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
import FinalSlide from './FinalSlide';
import { useSaveProgressOnLeave } from '@/src/hooks/useSaveProgressOnExit';
import LessonProgressBars from './components/LessonProgressBars';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import { sendLastSlideEmail } from '@/src/services/emailService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLessonsStore } from '@/src/stores/lessonsStore';

const analyticsStore = useAnalyticsStore.getState();

// <<<<<<< HEAD
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

export default function ModuleScreen() {
  const { moduleId, courseId, slideId } = useLocalSearchParams<{
    moduleId?: string;
    courseId?: string;
    slideId?: string;
  }>();

  const { lessons, isLoadingModule, errorModule, fetchLessonByModule } = useLessonsStore();
  const { slides, isLoading, error, fetchSlidesByLessons, clearError } = useSlidesStore();
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!moduleId) return;
    fetchLessonByModule(moduleId).catch((err) => console.error(err));
  }, [moduleId]);

  useEffect(() => {
    if (lessons.length === 0) return;
    fetchSlidesByLessons(lessons);
  }, [lessons]);

  const emailSentRef = useRef(false);

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

  useEffect(() => {
    if (height > stablePageHeightRef.current) {
      stablePageHeightRef.current = height;
      setPageH(height);
    }
  }, [height, width]);

  const [currentSlideId, setCurrentSlideId] = useState<string | undefined>(slideId);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number | undefined>(0);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const showPagination = useMemo(() => slides.length > 1, [slides.length]);

  // Navigation header (LessonProgressBars) will decide styling per-slide; don't need isCurrentDashboard here

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
      if (index < 0) return;

      // If scrolled to final slide (index === slides.length), mark as final and don't try to save progress
      if (index === slides.length) {
        setCurrentSlideId('final-slide');
        setCurrentSlideIndex(index);
        // clear slideId param in URL
        router.setParams({ slideId: undefined });
        return;
      }

      if (index >= slides.length) return;

      setCurrentSlideId(slides[index].id);
      setCurrentSlideIndex(index);
      updateUrl(slides[index].id);

      if (!user || !courseId || !moduleId) return;

      if (index > lastSavedIndexRef.current) {
        await setModuleProgressSafe(courseId, moduleId, index, slides.length, slides[index].id);
        lastSavedIndexRef.current = index;
      }
    },
    [moduleId, courseId, user?.id, slides, router],
  );

  const { average, skills, fetchAverage, fetchSkills } = useMainRatingStore();

  useEffect(() => {
    if (!user?.id || !moduleId) return;

    fetchAverage(user.id, moduleId);
    fetchSkills(user.id, moduleId);
  }, [user, moduleId]);

  useEffect(() => {
    if (!moduleId || slides.length === 0) return;

    const index = slides.findIndex((s) => s.id === slideId);
    const currentIndex = index >= 0 ? index : 0;

    analyticsStore.trackEvent('course_screen__load', {
      id: moduleId,
      index: currentIndex,
      pages: slides.length,
    });
  }, [moduleId, slides.length, slideId]);

  useSaveProgressOnLeave();

  useEffect(() => {
    if (slides.length === 0) return;
    if (slideId) return;
    const firstSlide = slides[0];
    setCurrentSlideId(firstSlide.id);
    setCurrentSlideIndex(0);
    setTimeout(() => {
      router.setParams({ slideId: firstSlide.id });
    }, 0);
  }, [slides]);

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

        // debug logs removed

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
    [average, courseId, moduleId, skills, slides, user?.email, user?.id],
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

  const goToNextSlide = async () => {
    // debug logs removed
    const currentIndex = slides.findIndex((s) => s.id === currentSlideId);
    if (currentIndex < 0) return;

    const nextIndex = currentIndex + 1;
    // allow navigating to the final slide which is at index === slides.length
    if (nextIndex > slides.length) return;

    scrollViewRef.current?.scrollTo({ y: nextIndex * pageH, animated: true });
    await handleSlideChange(nextIndex);
  };

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

  useEffect(() => {
    if (!user?.id || !moduleId) return;

    fetchAverage(user.id, moduleId);
    fetchSkills(user.id, moduleId);
  }, [user, moduleId]);

  useEffect(() => {
    if (!moduleId || slides.length === 0) return;

    const index = slides.findIndex((s) => s.id === slideId);
    const currentIndex = index >= 0 ? index : 0;

    analyticsStore.trackEvent('course_screen__load', {
      id: moduleId,
      index: currentIndex,
      pages: slides.length,
    });
  }, [moduleId, slides.length, slideId]);

  if (error || errorModule)
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Помилка: {error}</Text>
        <Text
          style={styles.retryText}
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
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEnabled={scrollEnabled}
        contentContainerStyle={{ minHeight: pageH * Math.max(slides.length + 1, 1) }}
      >
        {slides.map((slide, i) => (
          <View key={slide.id} style={{ width, height: pageH }}>
            <ModuleSlide
              slideId={slide.id}
              isActive={currentSlideId === slide.id}
              onComplete={goToNextSlide}
              currentIndex={i}
              totalSlides={slides.length}
              setScrollEnabled={setScrollEnabled}
              isMuted={isMuted}
              toggleMute={toggleMute}
              lessonsId={slide.lesson_id}
            />
          </View>
        ))}
        {/* Final course completion slide */}
        <View key="final-slide" style={{ width, height: pageH }}>
          <FinalSlide courseId={courseId} />
        </View>
      </Animated.ScrollView>

      {showPagination && slides.length > 0 && (currentSlideIndex ?? 0) < slides.length && (
        <LessonProgressBars
          slides={slides}
          lessons={lessons}
          currentSlideId={currentSlideId}
          currentSlideIndex={currentSlideIndex ?? 0}
          courseId={courseId}
          isMuted={isMuted}
          toggleMute={toggleMute}
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