import { create } from 'zustand';
import { supabase } from '../config/supabaseClient';
import { useSlidesStore } from './slidesStore';
import { useModulesStore } from './modulesStore';
import { useAuthStore } from './authStore';
import { useCourseStore } from './courseStore';
import { loadProgressLocal, saveProgressLocal } from '../utils/progressAsyncStorage';
import { UserCourseSummary } from '../constants/types/progress';




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
      // 1) пробуємо з AsyncStorage
      const localData = await loadProgressLocal(userId);
      if (localData.length > 0) {
        set({ courses: localData });
        return;
      }

      // 2) якщо в AsyncStorage нема → беремо з БД
      const { data, error } = await supabase
        .from('user_course_summaries')
        .select('course_id, progress, last_slide_id')
        .eq('user_id', userId);

      if (error) throw error;

      const courses = (data || []).map(c => ({ ...c, modules: [] }));
      set({ courses });

      // 3) кешуємо в AsyncStorage
      await saveProgressLocal(userId, courses);

    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  setCourseProgress: (courseId, progress, lastSlideId = null) => {
    const { user } = useAuthStore.getState();
    set(state => {
      const updatedCourses = state.courses.map(c =>
        c.course_id === courseId
          ? { ...c, progress, last_slide_id: lastSlideId }
          : c
      );
      if (user) saveProgressLocal(user.id, updatedCourses); // ⚡ зберігаємо локально
      return { courses: updatedCourses };
    });
  },

  getCourseProgress: (courseId) => {
    return get().courses.find(c => c.course_id === courseId)?.progress ?? 0;
  },
  

  setModuleProgressSafe: async (courseId, moduleId, currentSlideIndex, totalSlides, lastSlideId) => {
    const { user } = useAuthStore.getState();
    if (!user || !courseId) return;

    const percent = Math.round(((currentSlideIndex + 1) / totalSlides) * 100);
  
    set(state => {
      const course = state.courses.find(c => c.course_id === courseId);
      if (!course) return state;
  
      const moduleIndex = course.modules.findIndex(m => m.module_id === moduleId);
      if (moduleIndex >= 0) {
        course.modules[moduleIndex] = {
          module_id: moduleId,
          progress: percent,
          last_slide_id: lastSlideId || null,
        };
      } else {
        course.modules.push({
          module_id: moduleId,
          progress: percent,
          last_slide_id: lastSlideId || null,
        });
      }
  
      // перерахуємо прогрес курсу
      const courseProgress = Math.round(
        course.modules.reduce((sum, m) => sum + m.progress, 0) / course.modules.length
      );
      course.progress = courseProgress;
  
      const updatedCourses = [...state.courses];
      return { courses: persistCourses(updatedCourses) };
    });
  },
  

  getModuleProgress: (courseId?: string, moduleId?: string) => {
    if (!courseId || !moduleId) return 0;
    const course = get().courses.find(c => c.course_id === courseId);
    const module = course?.modules.find(m => m.module_id === moduleId);
    return module?.progress ?? 0;
  }
}));
