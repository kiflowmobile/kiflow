// Re-export from new location for backwards compatibility
// TODO: Update imports to use @/src/features/lessons directly
import { lessonsApi } from '@/src/features/lessons';

// Legacy function exports for backwards compatibility
export const fetchLessonsByModule = lessonsApi.fetchLessonsByModule;
export const getLessonIdBySlideId = lessonsApi.getLessonIdBySlideId;
export const getLessonById = lessonsApi.getLessonById;
export const getLessonOrderBySlideId = lessonsApi.getLessonOrderBySlideId;
export const fetchLessonCountsByModuleIds = lessonsApi.fetchLessonCountsByModuleIds;
