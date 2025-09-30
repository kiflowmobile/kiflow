import { create } from 'zustand';
import { Course } from '@/src/constants/types/course';
import { getCurrentUser } from '@/src/utils/authUtils';
import { courseService } from '../services/courses';

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  isLoading: boolean;
  error: string | null;
  lastFetchTime: number | null;

  fetchCourses: () => Promise<void>;
  fetchCourseById: (id: string) => Promise<Course | null>;
  setCurrentCourse: (course: Course | null) => void;
  clearError: () => void;
  refreshCourses: () => Promise<void>;

  setCourses: (courses: Course[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const CACHE_DURATION = 5 * 60 * 1000;

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  currentCourse: null,
  isLoading: false,
  error: null,
  lastFetchTime: null,

  setCourses: (courses) => set({ courses }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchCourses: async () => {
    const { lastFetchTime } = get();
    const now = Date.now();

    if (lastFetchTime && (now - lastFetchTime) < CACHE_DURATION && get().courses.length > 0) return;

    set({ isLoading: true, error: null });

    try {
      const user = await getCurrentUser();

      let publicCoursesResult = await courseService.getPublicCourses();
      let allCourses = publicCoursesResult.data || [];

      if (user) {
        const userCompaniesResult = await courseService.getUserCompanyIds(user.id);
        const companyIds = userCompaniesResult.data?.map(c => c.company_id) || [];
        const companyCoursesResult = await courseService.getCompanyCourses(companyIds);

        const existingIds = new Set(allCourses.map(c => c.id));
        const uniqueCompanyCourses = (companyCoursesResult.data || []).filter(c => !existingIds.has(c.id));

        allCourses = [...allCourses, ...uniqueCompanyCourses];
      }

      set({
        courses: allCourses,
        isLoading: false,
        lastFetchTime: now,
        error: null,
      });

    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch courses',
        isLoading: false,
      });
    }
  },

  fetchCourseById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await courseService.getCourseById(id);
      if (error) throw error;

      set({ currentCourse: data, isLoading: false, error: null });
      return data || null;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch course', isLoading: false });
      return null;
    }
  },

  setCurrentCourse: (course) => set({ currentCourse: course }),
  clearError: () => set({ error: null }),
  refreshCourses: async () => {
    set({ lastFetchTime: null });
    await get().fetchCourses();
  },
}));
