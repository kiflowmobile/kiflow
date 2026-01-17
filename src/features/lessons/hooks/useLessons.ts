import { useLessonsStore } from '../store/lessonsStore';

/**
 * Hook to access lessons state and actions
 */
export function useLessons() {
  const lessons = useLessonsStore((state) => state.lessons);
  const isLoading = useLessonsStore((state) => state.isLoading);
  const error = useLessonsStore((state) => state.error);

  const fetchLessonsByModule = useLessonsStore(
    (state) => state.fetchLessonsByModule
  );
  const setLessons = useLessonsStore((state) => state.setLessons);
  const clearError = useLessonsStore((state) => state.clearError);
  const clearLessons = useLessonsStore((state) => state.clearLessons);

  return {
    // State
    lessons,
    isLoading,
    error,

    // Actions
    fetchLessonsByModule,
    setLessons,
    clearError,
    clearLessons,
  };
}

/**
 * Hook to get a lesson by ID from the current lessons list
 */
export function useLesson(lessonId: string | undefined) {
  const lessons = useLessonsStore((state) => state.lessons);

  const lesson = lessonId ? lessons.find((l) => l.id === lessonId) : null;

  return { lesson };
}

/**
 * Hook to get lessons filtered by module ID
 */
export function useLessonsByModule(moduleId: string | undefined) {
  const lessons = useLessonsStore((state) => state.lessons);

  const moduleLessons = moduleId
    ? lessons.filter((l) => l.module_id === moduleId)
    : [];

  return { lessons: moduleLessons };
}
