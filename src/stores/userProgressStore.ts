import { create } from 'zustand';
import { useSlidesStore } from './slidesStore';
import { useModulesStore } from './modulesStore';
import { useAuthStore } from './authStore';
import { loadProgressLocal, saveProgressLocal } from '../utils/progressAsyncStorage';
import { UserCourseSummary } from '../constants/types/progress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabaseClient';

const getAuthStore = () => require('./authStore').useAuthStore;


type ModuleProgressEntry = {
  module_id: string;
  progress: number;
  last_slide_id: string | null;
  total_slides?: number;
};

interface UserProgressStore {
  courses: UserCourseSummary[];
  isLoading: boolean;
  error: string | null;

  initFromLocal: () => Promise<void>;
  fetchUserProgress: (userId: string) => Promise<void>;

  setCourseProgress: (courseId: string, progress: number, lastSlideId?: string | null) => void;
  getCourseProgress: (courseId: string) => number;
  syncProgressFromDBToLocalStorage : () => void;

  setModuleProgressSafe: (
    courseId: string,
    moduleId: string,
    currentSlideIndex: number,
    totalSlides: number,
    lastSlideId?: string | null,
  ) => void;

  getModuleProgress: (courseId: string, moduleId: string) => number;

  syncProgressToDB: () => Promise<void>;

  resetCourseProgress: (courseId: string) => Promise<void>;
}

const computeArithmeticCourseProgress = (modules: { progress: number }[]): number => {
  if (!modules || modules.length === 0) return 0;
  const sum = modules.reduce((acc, m) => acc + (Number.isFinite(m.progress) ? m.progress : 0), 0);
  return Math.round(sum / modules.length);
};

const persistCourses = (courses: UserCourseSummary[]) => {
  const { user } = getAuthStore().getState();
  if (user) {
    saveProgressLocal(user.id, courses);
  }
  return courses;
};

export const useUserProgressStore = create<UserProgressStore>((set, get) => ({
  courses: [],
  isLoading: false,
  error: null,

  initFromLocal: async () => {
    const { user } = getAuthStore().getState();

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
    console.log('fetchUserProgress')
    set({ isLoading: true, error: null });
    try {
      const localData = await loadProgressLocal(userId);
      set({ courses: localData ?? [] });
    } catch (err: any) {
      set({ error: err.message, courses: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  setCourseProgress: (courseId, progress, lastSlideId = null) => {
    set((state) => {
      const updated = [...state.courses];
      const idx = updated.findIndex((c) => c.course_id === courseId);
      const sanitizedLastSlideId = lastSlideId ?? null;

      if (idx >= 0) {
        updated[idx] = {
          ...updated[idx],
          progress,
          last_slide_id: sanitizedLastSlideId,
        };
      } else {
        updated.push({
          course_id: courseId,
          progress,
          last_slide_id: sanitizedLastSlideId,
          modules: [],
        });
      }

      return { courses: persistCourses(updated) };
    });
  },

  setModuleProgressSafe: (courseId, moduleId, currentSlideIndex, totalSlides, lastSlideId) => {
    if (!courseId) return;
    if (!Number.isFinite(totalSlides) || totalSlides <= 0) return;
    const clampedIndex = Math.max(0, Math.min(currentSlideIndex, totalSlides - 1));

    const basePercent = Math.floor(((clampedIndex + 1) / totalSlides) * 100);
    const percent = clampedIndex === totalSlides - 1 ? 100 : Math.min(basePercent, 99);

    const sanitizedLastSlideId = lastSlideId ?? null;

    set((state) => {
      const updatedCourses = [...state.courses];
      const courseIndex = updatedCourses.findIndex((c) => c.course_id === courseId);
      const existingCourse = courseIndex >= 0 ? updatedCourses[courseIndex] : null;

      const existingModules = (existingCourse?.modules ?? []) as unknown as ModuleProgressEntry[];

      const moduleMap = new Map<string, ModuleProgressEntry>(
        existingModules.map((m) => [
          m.module_id,
          {
            module_id: m.module_id,
            progress: Number.isFinite(m.progress) ? m.progress : 0,
            last_slide_id: m.last_slide_id ?? null,
            total_slides:
              Number.isFinite(m.total_slides) && (m.total_slides ?? 0) > 0
                ? m.total_slides
                : undefined,
          },
        ]),
      );

      moduleMap.set(moduleId, {
        module_id: moduleId,
        progress: percent,
        last_slide_id: sanitizedLastSlideId,
        total_slides: totalSlides,
      });

      const { modules: modulesState } = useModulesStore.getState() as any;
      const courseModuleIds =
        modulesState?.filter((m: any) => m.course_id === courseId)?.map((m: any) => m.id) ?? [];

      let normalizedModules: ModuleProgressEntry[] =
        courseModuleIds.length > 0
          ? courseModuleIds.map(
              (id: string) =>
                moduleMap.get(id) ?? {
                  module_id: id,
                  progress: 0,
                  last_slide_id: null,
                  total_slides: undefined,
                },
            )
          : Array.from(moduleMap.values()).map((m) => ({
              ...m,
              total_slides:
                Number.isFinite(m.total_slides) && (m.total_slides ?? 0) > 0
                  ? m.total_slides
                  : undefined,
            }));

      if (courseModuleIds.length > 0) {
        moduleMap.forEach((module, id) => {
          if (!courseModuleIds.includes(id)) {
            normalizedModules.push({
              ...module,
              total_slides:
                Number.isFinite(module.total_slides) && (module.total_slides ?? 0) > 0
                  ? module.total_slides
                  : undefined,
            });
          }
        });
      }

      const courseProgress = computeArithmeticCourseProgress(normalizedModules);

      const updatedCourse: UserCourseSummary = {
        course_id: courseId,
        progress: courseProgress,
        last_slide_id: sanitizedLastSlideId,
        modules: normalizedModules as any,
      };

      if (courseIndex >= 0) {
        updatedCourses[courseIndex] = updatedCourse;
      } else {
        updatedCourses.push(updatedCourse);
      }

      return { courses: persistCourses(updatedCourses) };
    });
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
    const {user} = getAuthStore().getState();
    if(!user) return

    const allKeys = await AsyncStorage.getAllKeys();
    const progressKeys = allKeys.filter((k) => k.startsWith('progress_'));

    if(progressKeys.length === 0) return

    for(const progressKey of progressKeys) {
      const raw =  await AsyncStorage.getItem(progressKey)
      if(!raw) return
      const course = JSON.parse(raw)[0]

      const payload = {
        user_id: user.id,
        course_id: course.course_id,
        progress: course.progress,
        last_slide_id: course.last_slide_id,
        modules: course.modules
      }
      const { error } = await supabase
        .from('user_course_summaries')
        .upsert(payload, {
          onConflict: 'user_id,course_id',
      });

      if (error) {
        console.log("ERROR UPSERT:", error);
      }
    }
  },

  syncProgressFromDBToLocalStorage:async () => {
    try{
      const {user} = getAuthStore().getState();
      if(!user) return;
      
      const { data, error } = await supabase
      .from('user_course_summaries')
      .select('course_id, progress, last_slide_id, modules')
      .eq('user_id', user.id);

      if(!data || data.length === 0) return

      let formatted = [];
      
      for (const item of data) {
        const newItem = {
          course_id: item.course_id,
          progress: item.progress,
          last_slide_id: item.last_slide_id,
          modules: item.modules,
        }
        formatted.push(newItem)
      }
  
      await AsyncStorage.setItem(`progress_${user.id}`, JSON.stringify(formatted));

    }catch(err){
      console.log('❌ Failed to sync progress data from DB:',err)
    }
  },


  resetCourseProgress: async (courseId: string) => {
    const { user } = getAuthStore().getState();

    if (!user) return;

    useSlidesStore.getState().clearAnsweredSlides();

    set((state) => {
      const updatedCourses = state.courses.map((course) => {
        if (course.course_id === courseId) {
          return {
            ...course,
            progress: 0,
            last_slide_id: null,
            modules: course.modules.map((m: any) => ({
              module_id: m.module_id,
              progress: 0,
              last_slide_id: null,
              total_slides: undefined,
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
