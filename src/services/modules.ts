// Re-export from new location for backwards compatibility
// TODO: Update imports to use @/src/features/modules directly
import { modulesApi } from '@/src/features/modules';

// Legacy service interface for backwards compatibility
export const modulesService = {
  getModulesByCourse: modulesApi.getModulesByCourse,
  getMyModulesByCourses: modulesApi.getModulesByCourses,
  getModuleIdByLessonId: modulesApi.getModuleIdByLessonId,
};

