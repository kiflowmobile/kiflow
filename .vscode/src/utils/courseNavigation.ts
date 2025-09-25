import { Router } from 'expo-router';

export const navigateToCourse = (
  router: Router, 
  courseId: string, 
  lastSlideId?: string | null
) => {
  const params = lastSlideId ? { lastSlideId } : {};
  
  router.push({
    pathname: '/courses/[id]',
    params: { id: courseId, ...params }
  });
};
