import { SlideWrapper } from "@/components/lesson/components/SlideWrapper";
import { StoriesProgressBar } from "@/components/lesson/components/StoriesProgressBar";
import { SCREEN_HEIGHT } from "@/components/lesson/styles";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  getLessonById,
  getLessonsByModuleId,
  getModuleById,
  getModulesByCourseId,
  getSlidesByLessonId,
  getUserProgress,
  updateUserProgress,
} from "@/lib/database";
import { Lesson, Module, Slide } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View, ViewToken } from "react-native";
import Animated, { useAnimatedScrollHandler, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LessonNavigationProvider, useLessonNavigation } from "@/components/lesson/context/LessonNavigationContext";

interface ViewableItemsChanged {
  viewableItems: ViewToken[];
  changed: ViewToken[];
}

function LessonViewerContent() {
  const router = useRouter();
  const {
    id: courseId,
    moduleId,
    lessonId,
  } = useLocalSearchParams<{
    id: string;
    moduleId: string;
    lessonId: string;
  }>();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { allowNext } = useLessonNavigation();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [initialSlideIndex, setInitialSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasNextLesson, setHasNextLesson] = useState(true);
  const flatListRef = useRef<Animated.FlatList<Slide>>(null);
  const currentIndexRef = useRef(0);
  const slidesRef = useRef<Slide[]>([]);
  const userRef = useRef(user);
  const courseIdRef = useRef(courseId);

  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    courseIdRef.current = courseId;
  }, [courseId]);

  useEffect(() => {
    currentIndexRef.current = currentSlideIndex;
  }, [currentSlideIndex]);

  // Track vertical scroll
  const scrollY = useSharedValue(0);

  const loadLessonData = useCallback(async () => {
    if (!lessonId || !user) return;

    try {
      setLoading(true);

      const lessonData = await getLessonById(lessonId);
      if (!lessonData) {
        router.push("/(tabs)/courses");
        return;
      }

      setLesson(lessonData);

      if (moduleId) {
        const moduleData = await getModuleById(moduleId);
        setModule(moduleData);
      }

      const slidesData = await getSlidesByLessonId(lessonId);
      setSlides(slidesData);

      let startIndex = 0;
      if (courseId) {
        const progress = await getUserProgress(user.id, courseId);
        if (progress?.last_slide_id) {
          const lastIndex = slidesData.findIndex((s) => s.id === progress.last_slide_id);
          if (lastIndex >= 0) {
            startIndex = lastIndex;
          }
        }

        // If no progress yet, set it to the first slide
        if (slidesData.length > 0 && startIndex === 0 && !progress?.last_slide_id) {
          await updateUserProgress(user.id, courseId, slidesData[0].id);
        }
      }

      setInitialSlideIndex(startIndex);
      setCurrentSlideIndex(startIndex);

      // Check if there is a next lesson
      if (moduleId && courseId) {
        const lessons = await getLessonsByModuleId(moduleId);
        const currentIndex = lessons.findIndex((l) => l.id === lessonId);

        if (currentIndex < lessons.length - 1) {
          setHasNextLesson(true);
        } else {
          const modules = await getModulesByCourseId(courseId);
          const currentModuleIndex = modules.findIndex((m) => m.id === moduleId);

          if (currentModuleIndex < modules.length - 1) {
            const nextModuleLessons = await getLessonsByModuleId(modules[currentModuleIndex + 1].id);
            setHasNextLesson(nextModuleLessons.length > 0);
          } else {
            setHasNextLesson(false);
          }
        }
      }
    } catch (error) {
      console.error("Error loading lesson:", error);
    } finally {
      setLoading(false);
    }
  }, [lessonId, user, router, courseId, moduleId]);

  useEffect(() => {
    if (lessonId && user) {
      loadLessonData();
    }
  }, [lessonId, user, loadLessonData]);

  const handleViewableItemsChanged = useRef(({ viewableItems }: ViewableItemsChanged) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      const newIndex = viewableItems[0].index;
      setCurrentSlideIndex(newIndex);
    }
  }).current;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = useCallback(() => {
    const currentIndex = currentIndexRef.current;
    const currentSlide = slides[currentIndex];

    if (!currentSlide || !allowNext) return;

    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextSlide = slides[nextIndex];

      if (courseId && user && nextSlide) {
        updateUserProgress(user.id, courseId, nextSlide.id);
      }

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    } else {
      if (hasNextLesson) {
        router.replace(`/course/${courseId}/module/${moduleId}/lesson/${lessonId}/completed`);
      } else {
        router.replace(`/course/${courseId}/completed?moduleId=${moduleId}&lessonId=${lessonId}`);
      }
    }
  }, [slides, courseId, user, hasNextLesson, moduleId, lessonId, router, allowNext]);

  const handlePrevious = useCallback(() => {
    const currentIndex = currentIndexRef.current;
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    }
  }, []);

  const renderSlide = useCallback(
    ({ item, index }: { item: Slide; index: number }) => {
      return (
        <SlideWrapper
          index={index}
          scrollY={scrollY}
          onNext={handleNext}
          onPrevious={handlePrevious}
          module={module!}
          lesson={lesson!}
          slide={item}
          onClose={() => router.back()}
          isActive={index === currentSlideIndex}
        />
      );
    },
    [currentSlideIndex, handleNext, handlePrevious, lesson, module, router, scrollY]
  );

  if (loading || !lesson || slides.length === 0) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  const currentSlideType = slides[currentSlideIndex]?.type;
  const isDarkSlide = currentSlideType === "cover" || currentSlideType === "video";

  return (
    <View className="flex-1 bg-black">
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal={false}
        pagingEnabled={false}
        scrollEnabled={allowNext}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        initialScrollIndex={initialSlideIndex}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />

      <TouchableOpacity
        style={{ top: insets.top + 16, left: insets.left + 16 }}
        className="absolute z-1000"
        onPress={() => router.push(`/course/${courseId}`)}
        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
      >
        <IconSymbol name="xmark" size={24} color={isDarkSlide ? "#FFFFFF" : "#0F172A"} />
      </TouchableOpacity>

      {currentSlideType !== "cover" && (
        <View
          style={{ top: insets.top + 26 }}
          className="absolute left-1/2 -translate-x-[50%] w-[55%] flex-row gap-1 h-[3px]"
        >
          {slides.map((_, index) => (
            <StoriesProgressBar
              key={index}
              index={index}
              currentIndex={currentSlideIndex}
              scrollY={scrollY}
              isDark={isDarkSlide}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function LessonViewerScreen() {
  return (
    <LessonNavigationProvider>
      <LessonViewerContent />
    </LessonNavigationProvider>
  );
}
