import { supabase } from '@/src/config/supabaseClient';
import { Course } from '@/src/constants/types/course';
import { getCurrentUser } from '@/src/utils/authUtils';
import { create } from 'zustand';

interface CourseState {
  // Стан
  courses: Course[];
  currentCourse: Course | null;
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;
  
  // Дії
  fetchCourses: () => Promise<void>;
  fetchCourseById: (id: string) => Promise<Course | null>;
  setCurrentCourse: (course: Course | null) => void;
  clearError: () => void;
  refreshCourses: () => Promise<void>;
  
  // Внутрішні дії
  setCourses: (courses: Course[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// Тривалість кешу у мілісекундах (5 хвилин)
const CACHE_DURATION = 5 * 60 * 1000;

const getPublicCourses = async (): Promise<{ data: Course[] | null; error: any }> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_public', true);
  
  return { data, error };
};

const getCompanyCourses = async (companyIds: string[]): Promise<Course[]> => {
  if (companyIds.length === 0) return [];

  const { data: companyCourses, error } = await supabase
    .from('company_courses')
    .select('course_id')
    .in('company_id', companyIds);

  if (error || !companyCourses?.length) return [];

  const courseIds = companyCourses.map(item => item.course_id);
  const { data: coursesData, error: coursesError } = await supabase
    .from('courses')
    .select('*')
    .in('id', courseIds);

  return coursesError ? [] : (coursesData || []);
};

export const useCourseStore = create<CourseState>()(
  (set, get) => ({
    // Початковий стан
    courses: [],
    currentCourse: null,
    isLoading: false,
    error: null,
    lastFetchTime: null,

    // Дії
    fetchCourses: async () => {
      const { lastFetchTime } = get();
      const now = Date.now();
      
      // Перевіряємо, чи є у нас кешовані дані, які ще дійсні
      if (lastFetchTime && (now - lastFetchTime) < CACHE_DURATION && get().courses.length > 0) {
        console.log('📚 CourseStore: Using cached courses');
        return;
      }

      set({ isLoading: true, error: null });
      
      try {
        // Отримуємо поточного користувача
        const user = await getCurrentUser();
        
        if (!user) {
          // Завантажуємо лише публічні курси для гостей
          const { data, error } = await getPublicCourses();
          if (error) throw error;
          
          set({ 
            courses: data || [], 
            isLoading: false, 
            lastFetchTime: now,
            error: null 
          });
          return;
        }

        const { data: userCompanies, error: companiesError } = await supabase
          .from('company_members')
          .select('company_id')
          .eq('user_id', user.id);

        if (companiesError) {
          console.error('Error fetching user companies:', companiesError);
          const { data, error } = await getPublicCourses();
          if (error) throw error;
          
          set({ 
            courses: data || [], 
            isLoading: false, 
            lastFetchTime: now,
            error: null 
          });
          return;
        }

        const companyIds = userCompanies?.map(member => member.company_id) || [];
        
        const [publicCoursesResult, companyCourses] = await Promise.all([
          getPublicCourses(),
          getCompanyCourses(companyIds)
        ]);

        if (publicCoursesResult.error) {
          console.error('Error fetching public courses:', publicCoursesResult.error);
          throw publicCoursesResult.error;
        }

        const publicCourses = publicCoursesResult.data || [];
        const existingIds = new Set(publicCourses.map(course => course.id));
        const uniqueCompanyCourses = companyCourses.filter(course => !existingIds.has(course.id));
        
        const allCourses = [...publicCourses, ...uniqueCompanyCourses];

        set({ 
          courses: allCourses, 
          isLoading: false, 
          lastFetchTime: now,
          error: null 
        });
        
        console.log(`📚 CourseStore: Loaded ${allCourses.length} courses`);
      } catch (error: any) {
        console.error('❌ CourseStore: Error fetching courses:', error);
        set({ 
          error: error.message || 'Failed to fetch courses', 
          isLoading: false 
        });
        throw error;
      }
    },

    fetchCourseById: async (id: string) => {
      set({ isLoading: true, error: null });
      
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        set({ 
          currentCourse: data, 
          isLoading: false, 
          error: null 
        });
        
        return data;
      } catch (error: any) {
        console.error('❌ CourseStore: Error fetching course by ID:', error);
        set({ 
          error: error.message || 'Failed to fetch course', 
          isLoading: false 
        });
        return null;
      }
    },


    setCurrentCourse: (course: Course | null) => {
      set({ currentCourse: course });
    },

    clearError: () => set({ error: null }),

    refreshCourses: async () => {
      // Примусове оновлення шляхом очищення кешу
      set({ lastFetchTime: null });
      await get().fetchCourses();
    },

    // Внутрішні дії
    setCourses: (courses: Course[]) => set({ courses }),
    setLoading: (loading: boolean) => set({ isLoading: loading }),
    setError: (error: string | null) => set({ error }),
  })
);
