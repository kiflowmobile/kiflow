import { useSlidesStore } from '../store/slidesStore';
import type { Slide } from '../types';

/**
 * Hook to access slides state and actions
 */
export function useSlides() {
  const slides = useSlidesStore((state) => state.slides);
  const currentSlideIndex = useSlidesStore((state) => state.currentSlideIndex);
  const currentModuleId = useSlidesStore((state) => state.currentModuleId);
  const isLoading = useSlidesStore((state) => state.isLoading);
  const error = useSlidesStore((state) => state.error);

  const fetchSlidesByLessons = useSlidesStore(
    (state) => state.fetchSlidesByLessons
  );
  const setCurrentSlideIndex = useSlidesStore(
    (state) => state.setCurrentSlideIndex
  );
  const nextSlide = useSlidesStore((state) => state.nextSlide);
  const previousSlide = useSlidesStore((state) => state.previousSlide);
  const setSlides = useSlidesStore((state) => state.setSlides);
  const setCurrentModuleId = useSlidesStore(
    (state) => state.setCurrentModuleId
  );
  const getCurrentSlideId = useSlidesStore((state) => state.getCurrentSlideId);
  const clearError = useSlidesStore((state) => state.clearError);
  const clearSlides = useSlidesStore((state) => state.clearSlides);

  // Get current slide
  const currentSlide = slides[currentSlideIndex] ?? null;

  return {
    // State
    slides,
    currentSlide,
    currentSlideIndex,
    currentModuleId,
    isLoading,
    error,
    totalSlides: slides.length,

    // Actions
    fetchSlidesByLessons,
    setCurrentSlideIndex,
    nextSlide,
    previousSlide,
    setSlides,
    setCurrentModuleId,
    getCurrentSlideId,
    clearError,
    clearSlides,
  };
}

/**
 * Hook for quiz answer tracking
 */
export function useSlideAnswers() {
  const answeredBySlideId = useSlidesStore((state) => state.answeredBySlideId);
  const isSlideAnswered = useSlidesStore((state) => state.isSlideAnswered);
  const markSlideAnswered = useSlidesStore((state) => state.markSlideAnswered);
  const clearAnsweredSlides = useSlidesStore(
    (state) => state.clearAnsweredSlides
  );

  return {
    answeredBySlideId,
    isSlideAnswered,
    markSlideAnswered,
    clearAnsweredSlides,
  };
}

/**
 * Hook to get a slide by ID
 */
export function useSlide(slideId: string | undefined) {
  const slides = useSlidesStore((state) => state.slides);

  const slide = slideId ? slides.find((s) => s.id === slideId) : null;

  return { slide };
}

/**
 * Hook to navigate slides with keyboard or swipe
 */
export function useSlideNavigation() {
  const currentSlideIndex = useSlidesStore((state) => state.currentSlideIndex);
  const slides = useSlidesStore((state) => state.slides);
  const nextSlide = useSlidesStore((state) => state.nextSlide);
  const previousSlide = useSlidesStore((state) => state.previousSlide);
  const setCurrentSlideIndex = useSlidesStore(
    (state) => state.setCurrentSlideIndex
  );

  const canGoNext = currentSlideIndex < slides.length - 1;
  const canGoPrevious = currentSlideIndex > 0;

  const goToSlide = (index: number) => {
    if (index >= 0 && index < slides.length) {
      setCurrentSlideIndex(index);
    }
  };

  return {
    currentSlideIndex,
    totalSlides: slides.length,
    canGoNext,
    canGoPrevious,
    nextSlide,
    previousSlide,
    goToSlide,
  };
}
