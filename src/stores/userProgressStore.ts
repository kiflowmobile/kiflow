import { create } from 'zustand';
import { supabase } from '../config/supabaseClient';
import { useSlidesStore } from './slidesStore';
import { useModulesStore } from './modulesStore';
import { useAuthStore } from './authStore';
import { useCourseStore } from './courseStore';

interface UserCourseSummary {
  course_id: string;
  progress: number;
  last_slide_id: string | null;
}

interface UserProgressStore {
  courses: UserCourseSummary[];
  isLoading: boolean;
  error: string | null;

  fetchUserProgress: (userId: string) => Promise<void>;
  setCourseProgress: (courseId: string, progress: number, lastSlideId?: string | null) => void;
  getCourseProgress: (courseId: string) => number;
  
  /** нове — робота з модулями */
  setModuleProgressSafe: (moduleId: string, percent: number) => Promise<void>;
  getModuleProgress: (moduleId: string) => number;
}

export const useUserProgressStore = create<UserProgressStore>((set, get) => ({
  courses: [],
  isLoading: false,
  error: null,

  fetchUserProgress: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('user_course_summaries')
        .select('course_id, progress, last_slide_id')
        .eq('user_id', userId);

      if (error) throw error;
      set({ courses: data || [] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  setCourseProgress: (courseId, progress, lastSlideId = null) => {
    set(state => ({
      courses: state.courses.map(c =>
        c.course_id === courseId
          ? { ...c, progress, last_slide_id: lastSlideId }
          : c
      ),
    }));
  },

  getCourseProgress: (courseId) => {
    return get().courses.find(c => c.course_id === courseId)?.progress ?? 0;
  },

  /** тут ми додаємо оновлення прогресу модуля */
  setModuleProgressSafe: async (moduleId: string, percent: number) => {
    const { user } = useAuthStore.getState(); 
    const { currentCourse } = useCourseStore.getState(); 
    const { slides } = useSlidesStore.getState();
  
    if (!user || !currentCourse) return;
  
    // оновлюємо локально
    set(state => ({
      courses: state.courses.map(c =>
        c.course_id === currentCourse.id
          ? { ...c, progress: percent }
          : c
      )
    }));
  
    try {
      // last_slide_id беремо з останнього слайду модуля, якщо потрібно
      const lastSlideId = slides.length ? slides[slides.length - 1].id : null;
  
      // await supabase
      //   .from('user_course_summaries')
      //   .upsert(
      //     {
      //       user_id: user.id,
      //       course_id: currentCourse.id,
      //       module_id: moduleId,
      //       progress: percent,
      //       last_slide_id: lastSlideId
      //     },
      //     { onConflict: 'user_id,course_id,module_id' }
      //   );
    } catch (error) {
      console.error('❌ setModuleProgressSafe error', error);
    }
  },  
  

  getModuleProgress: (moduleId) => {
    // Якщо ти не зберігаєш прогрес модулів окремо в store — тут можна обчислювати
    // напр. на основі slides viewed / totalSlides
    return 0; // 👈 тимчасово заглушка
  },
}));
