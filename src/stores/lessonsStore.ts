// Re-export from new location for backwards compatibility
// TODO: Update imports to use @/src/features/lessons directly
import { useLessonsStore as _useLessonsStore } from '@/src/features/lessons';

export const useLessonsStore = _useLessonsStore;

// Legacy aliases - the new store uses slightly different property names:
// - isLoadingModule -> isLoading
// - errorModule -> error
// - fetchLessonByModule -> fetchLessonsByModule