import { create } from 'zustand';
import { lessonsApi } from '../api/lessonsApi';
import type { Lesson, LessonsStore } from '../types';

export const useLessonsStore = create<LessonsStore>()((set, get) => ({
  lessons: [],
  isLoading: false,
  error: null,
  // Backwards compatibility aliases
  get isLoadingModule() {
    return get().isLoading;
  },
  get errorModule() {
    return get().error;
  },

  fetchLessonsByModule: async (moduleId: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await lessonsApi.fetchLessonsByModule(moduleId);

      if (error) throw error;

      set({
        lessons: data || [],
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch lessons';
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  // Backwards compatibility alias
  fetchLessonByModule: async (moduleId: string) => {
    return get().fetchLessonsByModule(moduleId);
  },

  setLessons: (lessons: Lesson[]) => set({ lessons }),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setError: (error: string | null) => set({ error }),

  clearError: () => set({ error: null }),

  clearLessons: () =>
    set({
      lessons: [],
      error: null,
    }),
}));
