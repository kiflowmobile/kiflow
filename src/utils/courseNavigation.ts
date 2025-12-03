import { Router } from 'expo-router';
import { getLessonIdBySlideId } from '../services/lessons';
import { modulesService } from '../services/modules';

export const navigateToCourse = async (
  router: Router,
  courseId: string,
  lastSlideId?: string | null,
  moduleProgress?: number,
) => {
  try {
    if (moduleProgress === 100) {
      router.push({
        pathname: '/courses/[id]',
        params: { id: courseId },
      });
      return;
    }

    let moduleId: string | undefined;


    if (lastSlideId) {
      const { data, error } = await getLessonIdBySlideId(lastSlideId);
      if (error) throw error;

      const lessonId = data?.lesson_id;

      const { data: dataModule, error: errorModule } = await modulesService.getModuleIdByLessonId(lessonId!);
      if (errorModule) throw errorModule;

      const moduleId = dataModule?.module_id;
      console.log('moduleId', moduleId);
    }


    if (moduleId) {
      router.push({
        pathname: '/module/[moduleId]',
        params: {
          moduleId,
          courseId,
          slideId: lastSlideId ?? undefined,
        },
      });
    } 
    else {
      router.push({
        pathname: '/courses/[id]',
        params: { id: courseId },
      });
    }
  } catch (err) {
    console.error('Failed to navigate to course:', err);
  }
};
