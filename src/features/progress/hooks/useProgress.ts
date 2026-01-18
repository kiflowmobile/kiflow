import { useEffect, useRef } from 'react';
import { useUserProgressStore } from '../store/progressStore';

/**
 * Hook to access user progress state and actions
 */
export function useUserProgress() {
  const courses = useUserProgressStore((state) => state.courses);
  const isLoading = useUserProgressStore((state) => state.isLoading);
  const error = useUserProgressStore((state) => state.error);

  const initFromLocal = useUserProgressStore((state) => state.initFromLocal);
  const fetchUserProgress = useUserProgressStore((state) => state.fetchUserProgress);
  const setCourseProgress = useUserProgressStore((state) => state.setCourseProgress);
  const getCourseProgress = useUserProgressStore((state) => state.getCourseProgress);
  const setModuleProgressSafe = useUserProgressStore((state) => state.setModuleProgressSafe);
  const getModuleProgress = useUserProgressStore((state) => state.getModuleProgress);
  const syncProgressToDB = useUserProgressStore((state) => state.syncProgressToDB);
  const resetCourseProgress = useUserProgressStore((state) => state.resetCourseProgress);

  return {
    // State
    courses,
    isLoading,
    error,

    // Actions
    initFromLocal,
    fetchUserProgress,
    setCourseProgress,
    getCourseProgress,
    setModuleProgressSafe,
    getModuleProgress,
    syncProgressToDB,
    resetCourseProgress,
  };
}

/**
 * Hook to get course progress with completion tracking
 */
export function useCourseProgress(courseId: string) {
  const courses = useUserProgressStore((state) => state.courses);
  const course = courses.find((c) => c.course_id === courseId);
  const prevProgressRef = useRef(course?.progress ?? 0);

  // Track course completion
  useEffect(() => {
    if (!course) return;

    const prevProgress = prevProgressRef.current;
    const currentProgress = course.progress ?? 0;

    if (currentProgress === 100 && prevProgress < 100) {
      // Course completed - analytics tracking can be added here
    }

    prevProgressRef.current = currentProgress;
  }, [course?.progress, courseId, course]);

  return {
    courseProgress: course?.progress ?? 0,
    lastSlideId: course?.last_slide_id ?? null,
    modules: course?.modules ?? [],
  };
}

/**
 * Hook to get module progress
 */
export function useModuleProgress(courseId: string, moduleId: string) {
  const getModuleProgress = useUserProgressStore((state) => state.getModuleProgress);
  const courses = useUserProgressStore((state) => state.courses);

  const course = courses.find((c) => c.course_id === courseId);
  const module = course?.modules.find((m) => m.module_id === moduleId);

  return {
    progress: getModuleProgress(courseId, moduleId),
    lastSlideId: module?.last_slide_id ?? null,
  };
}
