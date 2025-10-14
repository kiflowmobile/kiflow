import { create } from 'zustand';
import { supabase } from '../config/supabaseClient';
import { useSlidesStore } from './slidesStore';
import { useModulesStore } from './modulesStore';
import { useAuthStore } from './authStore';
import { loadProgressLocal, saveProgressLocal } from '../utils/progressAsyncStorage';
import { UserCourseSummary } from '../constants/types/progress';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface UserProgressStore {
  courses: UserCourseSummary[];
  isLoading: boolean;
  error: string | null;
  initFromLocal: () => Promise<void>;
  fetchUserProgress: (userId: string) => Promise<void>;
  setCourseProgress: (courseId: string, progress: number, lastSlideId?: string | null) => void;
  getCourseProgress: (courseId: string) => number;
  
  setModuleProgressSafe: (
    courseId: string,
    moduleId: string, 
    currentSlideIndex: number, 
    totalSlides: number, 
    lastSlideId?: string
  ) => Promise<void>;
    getModuleProgress: (courseId:string,moduleId: string) => number;
    syncProgressToDB: () => Promise<void>
    resetCourseProgress: (courseId: string) => Promise<void>
}

const persistCourses = (courses: UserCourseSummary[]) => {
  const { user } = useAuthStore.getState();
  if (user) {
    saveProgressLocal(user.id, courses);
  }
  return courses;
}

export const useUserProgressStore = create<UserProgressStore>((set, get) => ({
  courses: [],
  isLoading: false,
  error: null,

  initFromLocal: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    try {
      const localData = await loadProgressLocal(user.id);
      if (localData && localData.length > 0) {
        set({ courses: localData });
      }
    } catch (err) {
      console.error('Помилка ініціалізації прогресу:', err);
    }
  },

  fetchUserProgress: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('user_course_summaries')
        .select('course_id, progress, last_slide_id, modules')
        .eq('user_id', userId);

      if (error) throw error;

      const localData = await loadProgressLocal(userId);
      const remoteCourses = (data || []).map((c) => ({
        course_id: c.course_id,
        progress: c.progress,
        last_slide_id: c.last_slide_id,
        modules: c.modules || [],
      }));

      if (remoteCourses.length > 0) {
        set({ courses: remoteCourses });
        await saveProgressLocal(userId, remoteCourses);
      } else if (localData.length > 0) {
        set({ courses: localData });
      } else {
        set({ courses: [] });
      }
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  setCourseProgress: (courseId, progress, lastSlideId = null) => {
    set((state) => {
      const updatedCourses = [...state.courses];
      const courseIndex = updatedCourses.findIndex((c) => c.course_id === courseId);
      const sanitizedLastSlideId = lastSlideId ?? null;

      if (courseIndex >= 0) {
        updatedCourses[courseIndex] = {
          ...updatedCourses[courseIndex],
          progress,
          last_slide_id: sanitizedLastSlideId,
        };
      } else {
        updatedCourses.push({
          course_id: courseId,
          progress,
          last_slide_id: sanitizedLastSlideId,
          modules: [],
        });
      }

      return { courses: persistCourses(updatedCourses) };
    });
  },

  getCourseProgress: (courseId) => {
    return get().courses.find(c => c.course_id === courseId)?.progress ?? 0;
  },

  setModuleProgressSafe: async (courseId, moduleId, currentSlideIndex, totalSlides, lastSlideId) => {
    const { user } = useAuthStore.getState();
    if (!user || !courseId || totalSlides <= 0) return;

    const percent = Math.min(100, Math.round(((currentSlideIndex + 1) / totalSlides) * 100));
    const sanitizedLastSlideId = lastSlideId ?? null;

    set((state) => {
      const updatedCourses = [...state.courses];
      const courseIndex = updatedCourses.findIndex((c) => c.course_id === courseId);
      const existingCourse = courseIndex >= 0 ? updatedCourses[courseIndex] : null;

      const existingModules = existingCourse ? existingCourse.modules : [];
      const moduleMap = new Map(
        existingModules.map((m) => [
          m.module_id,
          { ...m, last_slide_id: m.last_slide_id ?? null },
        ]),
      );

      moduleMap.set(moduleId, {
        module_id: moduleId,
        progress: percent,
        last_slide_id: sanitizedLastSlideId,
      });

      const { modules: modulesState } = useModulesStore.getState();
      const courseModuleIds = modulesState
        .filter((module) => module.course_id === courseId)
        .map((module) => module.id);

      let normalizedModules = courseModuleIds.map((id) =>
        moduleMap.get(id) ?? {
          module_id: id,
          progress: 0,
          last_slide_id: null,
        },
      );

      if (normalizedModules.length === 0) {
        normalizedModules = Array.from(moduleMap.values());
      } else {
        moduleMap.forEach((module, id) => {
          if (!courseModuleIds.includes(id)) {
            normalizedModules.push(module);
          }
        });
      }

      const courseProgress =
        normalizedModules.length > 0
          ? Math.round(
              normalizedModules.reduce((sum, m) => sum + m.progress, 0) / normalizedModules.length,
            )
          : percent;

      const updatedCourse: UserCourseSummary = {
        course_id: courseId,
        progress: courseProgress,
        last_slide_id: sanitizedLastSlideId,
        modules: normalizedModules,
      };

      if (courseIndex >= 0) {
        updatedCourses[courseIndex] = updatedCourse;
      } else {
        updatedCourses.push(updatedCourse);
      }

      return { courses: persistCourses(updatedCourses) };
    });
  },

  getModuleProgress: (courseId?: string, moduleId?: string) => {
    if (!courseId || !moduleId) return 0;
    const course = get().courses.find(c => c.course_id === courseId);
    const module = course?.modules.find(m => m.module_id === moduleId);
    return module?.progress ?? 0;
  },

  syncProgressToDB: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;
  
    try {
      const { courses } = get();
  
      for (const course of courses) {
        const { course_id, progress, last_slide_id, modules } = course;
  
        const { error } = await supabase
          .from('user_course_summaries')
          .upsert({
            user_id: user.id,
            course_id,
            progress,
            last_slide_id,
            modules, 
          },
          { onConflict: 'user_id, course_id'} 
        );
  
        if (error) throw error;

        await AsyncStorage.removeItem(`progress_${user.id}`);

      }
    
      await AsyncStorage.removeItem(`progress_${user.id}`);
  
    } catch (err: any) {
      console.error('Помилка синхронізації прогресу з БД:', err.message);
    }
  },

  resetCourseProgress: async (courseId: string) => {
    const { user } = useAuthStore.getState();
    if (!user) return;
  
    // Очистити відповіді AI слайдів
    useSlidesStore.getState().clearAnsweredSlides();
  
    set(state => {
      const updatedCourses = state.courses.map(course => {
        if (course.course_id === courseId) {
          return {
            ...course,
            progress: 0,
            last_slide_id: null,
            modules: course.modules.map(m => ({
              ...m,
              progress: 0,
              last_slide_id: null,
            })),
          };
        }
        return course;
      });
  
      saveProgressLocal(user.id, updatedCourses);  
      return { courses: updatedCourses };
    });
  },
  
  
}));
