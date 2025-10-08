import { Router } from 'expo-router';
import { supabase } from '@/src/config/supabaseClient';

export const navigateToCourse = async (
  router: Router,
  courseId: string,
  lastSlideId?: string | null,
  moduleProgress?: number,
) => {

  try {

    console.log(moduleProgress)

    if(moduleProgress === 100) {
      router.push({
        pathname: '/courses/[id]',
        params: { id: courseId },
      });
      return
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
      router.push({
        pathname: '/module/[moduleId]',
        params: {
          moduleId,   
          courseId,
          slideId: lastSlideId ?? undefined,
        },
      });
    } else {
      router.push({
        pathname: '/courses/[id]',
        params: { id: courseId },
      });
    }
  } catch (err) {
    // console.error('Failed to navigate to course:', err);
  }
};
