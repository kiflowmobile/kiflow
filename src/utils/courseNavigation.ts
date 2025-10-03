import { Router } from 'expo-router';
import { supabase } from '@/src/config/supabaseClient';

export const navigateToCourse = async (
  router: Router,
  courseId: string,
  lastSlideId?: string | null
) => {
  try {
    // let moduleId: string | undefined;

    // console.log('lastSlideId',lastSlideId)

    // if (lastSlideId) {
    //   // шукаємо module_id для lastSlideId
    //   const { data, error } = await supabase
    //     .from('slides')
    //     .select('module_id')
    //     .eq('id', lastSlideId)
    //     .single();

    //   if (error) throw error;
    //   moduleId = data?.module_id;
    // }


    // console.log('moduleId', moduleId)

    // if (moduleId) {
    //   // йдемо на модуль з останнього слайду
    //   router.push({
    //     pathname: '/module/[id]',
    //     params: {
    //       id: moduleId,
    //       courseId,
    //       slideId: lastSlideId,
    //     },
    //   });
    // } else {
      // якщо lastSlideId немає — можна перейти просто на список модулів курсу
      router.push({
        pathname: '/courses/[id]',
        params: { id: courseId },
      });
    // }
  } catch (err) {
    console.error('Failed to navigate to course:', err);
  }
};


// export const navigateToCourse = (router:Router, courseId: string, lastSlideId?: string | null) => {
//     const params = lastSlideId ? { lastSlideId } : {};

//   if (lastSlideId) {
//     router.push({ pathname: '/module/[id]', params: { courseId, slideId: lastSlideId } });
//   } else {
//     router.push({ pathname: '/module/[id]', params: { courseId } });
//   }
// };