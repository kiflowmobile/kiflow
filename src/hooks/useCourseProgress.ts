import { useEffect, useRef } from 'react';
import { useUserProgressStore } from '@/src/stores';
import { useAnalyticsStore } from '../stores/analyticsStore';

export const useCourseProgress = (courseId: string) => {
  const { courses } = useUserProgressStore();
  const course = courses.find(c => c.course_id === courseId);
  const analyticsStore = useAnalyticsStore.getState();
  const prevProgressRef = useRef(course?.progress ?? 0);

  useEffect(() => {
    if (!course) return;

    const prevProgress = prevProgressRef.current;
    const currentProgress = course.progress ?? 0;

    if (currentProgress === 100 && prevProgress < 100) {
      analyticsStore.trackEvent('course__finish', {
        id: courseId,
      });    
    }

    prevProgressRef.current = currentProgress;
  }, [course?.progress, courseId, course]);

  return {
    courseProgress: course?.progress ?? 0,
    lastSlideId: course?.last_slide_id ?? null,
    modules: course?.modules,
  };
};
