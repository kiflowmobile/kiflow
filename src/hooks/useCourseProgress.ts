import { useUserProgressStore } from '@/src/stores';

export const useCourseProgress = (courseId: string) => {
  const { courses } = useUserProgressStore();

  const course = courses.find(c => c.course_id === courseId);

  return {
    courseProgress: course?.progress ?? 0,
    lastSlideId: course?.last_slide_id ?? null,
  };
};