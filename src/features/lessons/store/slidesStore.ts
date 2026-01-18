import { create } from 'zustand';
import { slidesApi } from '../api/slidesApi';
import type { Slide, Lesson, SlidesStore } from '../types';

export const useSlidesStore = create<SlidesStore>((set, get) => ({
  slides: [],
  currentSlideIndex: 0,
  currentModuleId: null,
  isLoading: false,
  error: null,
  answeredBySlideId: {},

  fetchSlidesByLessons: async (lessons: Lesson[]) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await slidesApi.fetchSlidesByLessons(lessons);

      if (error) throw error;

      set({
        slides: data || [],
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch slides';
      console.error('SlidesStore: Error fetching slides:', error);
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  setCurrentSlideIndex: (index: number) => {
    const { slides } = get();
    const safeIndex = Math.max(0, Math.min(index, slides.length - 1));
    set({ currentSlideIndex: safeIndex });
  },

  nextSlide: () => {
    const { currentSlideIndex, slides } = get();
    const nextIndex = currentSlideIndex + 1;
    if (nextIndex < slides.length) {
      set({ currentSlideIndex: nextIndex });
    }
  },

  previousSlide: () => {
    const { currentSlideIndex } = get();
    const prevIndex = currentSlideIndex - 1;
    if (prevIndex >= 0) {
      set({ currentSlideIndex: prevIndex });
    }
  },

  setSlides: (slides: Slide[]) => set({ slides }),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setError: (error: string | null) => set({ error }),

  setCurrentModuleId: (moduleId: string | null) => set({ currentModuleId: moduleId }),

  getCurrentSlideId: () => {
    const { slides, currentSlideIndex } = get();
    return slides[currentSlideIndex]?.id ?? null;
  },

  isSlideAnswered: (slideId: string) => {
    return Boolean(get().answeredBySlideId[slideId]);
  },

  markSlideAnswered: (slideId: string) => {
    if (!slideId) return;
    set((state) => ({
      answeredBySlideId: { ...state.answeredBySlideId, [slideId]: true },
    }));
  },

  clearAnsweredSlides: () => {
    set((state) => ({
      answeredBySlideId: Object.fromEntries(
        Object.keys(state.answeredBySlideId).map((key) => [key, false]),
      ),
    }));
  },

  clearError: () => set({ error: null }),

  clearSlides: () =>
    set({
      slides: [],
      currentSlideIndex: 0,
      currentModuleId: null,
      answeredBySlideId: {},
    }),
}));
