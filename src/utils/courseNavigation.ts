import { Router } from 'expo-router';
import { supabase } from '@/src/config/supabaseClient';

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
      const { data, error } = await supabase
        .from('slides')
        .select('module_id')
        .eq('id', lastSlideId)
        .single();

      if (error) throw error;
      moduleId = data?.module_id;
    }

    if (moduleId) {
      if (typeof window !== 'undefined') {
        // on web push query style to avoid creating extra path segments
        router.push({
          pathname: '/module/[moduleId]',
          params: { moduleId, courseId, slideId: lastSlideId ?? undefined },
        });
      } else {
        router.push({
          pathname: '/module/[moduleId]',
          params: {
            moduleId,
            courseId,
            slideId: lastSlideId ?? undefined,
          },
        });
      }
    } else {
      router.push({
        pathname: '/courses/[id]',
        params: { id: courseId },
      });
    }
  } catch {
    // console.error('Failed to navigate to course');
  }
};
