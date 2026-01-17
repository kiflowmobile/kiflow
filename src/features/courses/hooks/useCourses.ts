import { useCallback } from 'react';
import { useCourseStore } from '../store/coursesStore';
import type { Course } from '../types';

/**
 * Hook to access courses state and actions
 */
export function useCourses() {
  const courses = useCourseStore((state) => state.courses);
  const currentCourse = useCourseStore((state) => state.currentCourse);
  const isLoading = useCourseStore((state) => state.isLoading);
  const error = useCourseStore((state) => state.error);

  const fetchCourses = useCourseStore((state) => state.fetchCourses);
  const fetchCourseById = useCourseStore((state) => state.fetchCourseById);
  const setCurrentCourse = useCourseStore((state) => state.setCurrentCourse);
  const clearError = useCourseStore((state) => state.clearError);
  const refreshCourses = useCourseStore((state) => state.refreshCourses);

  return {
    // State
    courses,
    currentCourse,
    isLoading,
    error,

    // Actions
    fetchCourses,
    fetchCourseById,
    setCurrentCourse,
    clearError,
    refreshCourses,
  };
}

/**
 * Hook to get a single course by ID
 */
export function useCourse(courseId: string | undefined) {
  const courses = useCourseStore((state) => state.courses);
  const currentCourse = useCourseStore((state) => state.currentCourse);
  const fetchCourseById = useCourseStore((state) => state.fetchCourseById);

  const course = courseId
    ? currentCourse?.id === courseId
      ? currentCourse
      : courses.find((c) => c.id === courseId)
    : null;

  const loadCourse = useCallback(async () => {
    if (courseId && !course) {
      return fetchCourseById(courseId);
    }
    return course;
  }, [courseId, course, fetchCourseById]);

  return { course, loadCourse };
}

/**
 * Hook to get public courses only
 */
export function usePublicCourses() {
  const courses = useCourseStore((state) => state.courses);
  return courses.filter((course) => course.is_public);
}
