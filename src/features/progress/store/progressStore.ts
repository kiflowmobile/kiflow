import { create } from 'zustand';
import { progressApi } from '../api/progressApi';
import { saveProgressLocal, loadProgressLocal } from '../utils/progressStorage';
import type { UserCourseSummary, ProgressStore } from '../types';

// Lazy imports to avoid circular dependencies
const getAuthStore = () =>
  import('@/features/auth').then((m) => m.useAuthStore);

const getSlidesStore = () =>
  import('@/features/lessons').then((m) => m.useSlidesStore);

const persistCourses = async (courses: UserCourseSummary[]) => {
  const authStore = await getAuthStore();
  const { user } = authStore.getState();
  if (user) {
    saveProgressLocal(user.id, courses);
  }
  return courses;
};

export const useUserProgressStore = create<ProgressStore>((set, get) => ({
  courses: [],
  isLoading: false,
  error: null,

  initFromLocal: async () => {
    const authStore = await getAuthStore();
    const { user } = authStore.getState();
    if (!user) return;

    try {
      const localData = await loadProgressLocal(user.id);
      if (localData && localData.length > 0) {
        set({ courses: localData });
      }
    } catch (err) {
      console.error('Error initializing progress:', err);
    }
  },

  fetchUserProgress: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await progressApi.getUserCourseProgressView(userId);
      if (error) throw error;
      // Note: The view data could be used to update the store if needed
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch progress';
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  setCourseProgress: (courseId, progress, lastSlideId = null) => {
    set((state) => {
      const updated = [...state.courses];
      const idx = updated.findIndex((c) => c.course_id === courseId);
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], progress, last_slide_id: lastSlideId };
      } else {
        updated.push({
          course_id: courseId,
          progress,
          last_slide_id: lastSlideId,
          modules: [],
        });
      }
      persistCourses(updated);
      return { courses: updated };
    });
  },

  setModuleProgressSafe: async (
    courseId,
    moduleId,
    currentSlideIndex,
    totalSlides,
    lastSlideId
  ) => {
    if (!courseId || !moduleId) return;

    const authStore = await getAuthStore();
    const { user } = authStore.getState();

    const clampedIndex = Math.max(0, Math.min(currentSlideIndex, totalSlides - 1));
    const basePercent = Math.floor(((clampedIndex + 1) / totalSlides) * 100);
    const percent = clampedIndex === totalSlides - 1 ? 100 : Math.min(basePercent, 99);
    const sanitizedLastSlideId = lastSlideId ?? null;

    // 1. Optimistic update local state
    set((state) => {
      const updatedCourses = [...state.courses];
      let courseIdx = updatedCourses.findIndex((c) => c.course_id === courseId);

      if (courseIdx === -1) {
        updatedCourses.push({
          course_id: courseId,
          progress: 0,
          last_slide_id: sanitizedLastSlideId,
          modules: [],
        });
        courseIdx = updatedCourses.length - 1;
      }

      const course = updatedCourses[courseIdx];
      const moduleIdx = course.modules.findIndex((m) => m.module_id === moduleId);

      const newModuleEntry = {
        module_id: moduleId,
        progress: percent,
        last_slide_id: sanitizedLastSlideId,
        total_slides: totalSlides,
      };

      if (moduleIdx >= 0) {
        course.modules[moduleIdx] = newModuleEntry;
      } else {
        course.modules.push(newModuleEntry);
      }

      // Calculate course progress as average of module progress
      const sum = course.modules.reduce((acc, m) => acc + (m.progress || 0), 0);
      course.progress = Math.round(sum / (course.modules.length || 1));
      course.last_slide_id = sanitizedLastSlideId;

      persistCourses(updatedCourses);
      return { courses: updatedCourses };
    });

    // 2. Sync to DB
    if (user) {
      try {
        await progressApi.upsertModuleProgress(
          user.id,
          moduleId,
          percent,
          sanitizedLastSlideId
        );
      } catch (err) {
        console.error('Failed to sync module progress:', err);
      }
    }
  },

  getModuleProgress: (courseId: string, moduleId: string) => {
    const course = get().courses.find((c) => c.course_id === courseId);
    const module = course?.modules.find((m) => m.module_id === moduleId);
    return module?.progress ?? 0;
  },

  getCourseProgress: (courseId) => {
    return get().courses.find((c) => c.course_id === courseId)?.progress ?? 0;
  },

  syncProgressToDB: async () => {
    const authStore = await getAuthStore();
    const { user } = authStore.getState();
    if (!user) return;

    const courses = get().courses;
    for (const course of courses) {
      for (const mod of course.modules) {
        await progressApi.upsertModuleProgress(
          user.id,
          mod.module_id,
          mod.progress,
          mod.last_slide_id
        );
      }
    }
  },

  syncProgressFromDBToLocalStorage: async () => {
    try {
      const authStore = await getAuthStore();
      const { user } = authStore.getState();
      if (!user) return;

      const { data: moduleData } = await progressApi.getUserModuleProgress(user.id);
      if (!moduleData) return;

      // Note: Complex reconstruction logic would be needed here to rebuild
      // the course summary structure from module progress data
    } catch (err) {
      console.error('Failed to sync progress from DB:', err);
    }
  },

  resetCourseProgress: async (courseId: string) => {
    const authStore = await getAuthStore();
    const { user } = authStore.getState();
    if (!user) return;

    const slidesStore = await getSlidesStore();
    slidesStore.getState().clearAnsweredSlides();

    set((state) => {
      const updatedCourses = state.courses.map((c) =>
        c.course_id === courseId ? { ...c, progress: 0, modules: [] } : c
      );
      saveProgressLocal(user.id, updatedCourses);
      return { courses: updatedCourses };
    });
  },
}));
