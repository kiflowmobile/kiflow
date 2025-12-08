import { create } from "zustand";
import { Lessons } from "../constants/types/lesson";
import { fetchLessonsByModule } from "../services/lessons";

interface SlidesState {
  lessons: Lessons[];
  isLoadingModule: boolean;
  errorModule: string | null;
  fetchLessonByModule: (moduleId: string) => Promise<void>;
}

export const useLessonsStore = create<SlidesState>()((set, get) => ({
  lessons: [],
  isLoadingModule: false,
  errorModule: null,
    fetchLessonByModule: async (moduleId: string) => {
      try {
        set({ isLoadingModule: true, errorModule: null });

        const { data, error } = await fetchLessonsByModule(moduleId)
        if (error) throw error;

        set({
        lessons: data,
        isLoadingModule: false,
      });

      } catch (error: any) {
        set({ errorModule: error.message || 'Failed to fetch slides', isLoadingModule: false });
        throw error;
      }
  },
}))