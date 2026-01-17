// Re-export from new location for backwards compatibility
// TODO: Update imports to use @/src/features/courses directly
import { coursesApi } from '@/src/features/courses';

// Legacy service interface for backwards compatibility
export const courseService = {
  getPublicCourses: async () => {
    const result = await coursesApi.getPublicCourses();
    return { data: result.data, error: result.error };
  },
  getCompanyCourses: async (companyIds: string[]) => {
    const result = await coursesApi.getCompanyCourses(companyIds);
    return { data: result.data, error: result.error };
  },
  getCoursesByIds: async (courseIds: string[]) => {
    const result = await coursesApi.getCoursesByIds(courseIds);
    return { data: result.data, error: result.error };
  },
  getCourseById: async (id: string) => {
    const result = await coursesApi.getCourseById(id);
    return { data: result.data, error: result.error };
  },
  getUserCompanyIds: async (userId: string) => {
    const result = await coursesApi.getUserCompanyIds(userId);
    return { data: result.data?.map((id) => ({ company_id: id })) ?? null, error: result.error };
  },
  updateLastSlideId: async () => {
    // Deprecated - not implemented
  },
};
