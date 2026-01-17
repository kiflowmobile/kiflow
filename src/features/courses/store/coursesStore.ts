import { create } from 'zustand';
import { coursesApi } from '../api/coursesApi';
import { getCurrentUser } from '@/src/features/auth';
import type { Course, CourseStore } from '../types';

// Lazy import to avoid circular dependencies
const getCompanyApi = () =>
  import('../../../services/users').then((m) => m.getCurrentUserCode);

export const useCourseStore = create<CourseStore>((set, get) => ({
  courses: [],
  currentCourse: null,
  isLoading: false,
  error: null,

  setCourses: (courses) => set({ courses }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  fetchCourses: async () => {
    set({ isLoading: true, error: null });

    try {
      // Get public courses
      const publicCoursesResult = await coursesApi.getPublicCourses();
      let allCourses = publicCoursesResult.data || [];

      // Get user's company courses if authenticated
      const user = await getCurrentUser();
      if (user) {
        try {
          const getCurrentUserCode = await getCompanyApi();
          const { code: currentCode } = await getCurrentUserCode();

          if (currentCode) {
            const companyIdsResult = await coursesApi.getUserCompanyIds(user.id);
            const companyIds = companyIdsResult.data || [];

            if (companyIds.length > 0) {
              const companyCoursesResult = await coursesApi.getCompanyCourses(companyIds);
              const companyCourses = companyCoursesResult.data || [];

              // Merge unique courses
              const existingIds = new Set(allCourses.map((c) => c.id));
              const uniqueCompanyCourses = companyCourses.filter(
                (c) => !existingIds.has(c.id)
              );
              allCourses = [...allCourses, ...uniqueCompanyCourses];
            }
          }
        } catch (companyError) {
          // Continue with public courses if company fetch fails
          console.warn('Failed to fetch company courses:', companyError);
        }
      }

      set({
        courses: allCourses,
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch courses';
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  fetchCourseById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await coursesApi.getCourseById(id);
      if (error) throw error;

      set({ currentCourse: data, isLoading: false, error: null });
      return data || null;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch course';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  setCurrentCourse: (course) => set({ currentCourse: course }),
  clearError: () => set({ error: null }),

  refreshCourses: async () => {
    await get().fetchCourses();
  },
}));
