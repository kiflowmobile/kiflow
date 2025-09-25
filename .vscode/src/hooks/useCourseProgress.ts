import { supabase } from '@/src/config/supabaseClient';
import type { Course } from '@/src/constants/types/course';
import { getUserCourseProgress } from '@/src/services/courses';
import { useAuthStore, useUserProgressStore } from '@/src/stores';
import { useCallback, useEffect, useState } from 'react';

export const useCourseProgress = (course: Course) => {
  const { getCourseProgress, progressByModule } = useUserProgressStore();
  const { user } = useAuthStore();
  const [courseProgress, setCourseProgress] = useState(0);
  const [lastSlideId, setLastSlideId] = useState<string | null>(null);

  // Завантажуємо модулі та розраховуємо прогрес
  const loadCourseProgress = useCallback(async () => {
    try {
      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', course.id);
      
      if (modules) {
        const moduleIds = modules.map(module => module.id);
        const progress = getCourseProgress(moduleIds);
        setCourseProgress(progress);
      }
    } catch (error) {
      console.error('Error fetching modules for progress:', error);
    }
  }, [course.id, getCourseProgress]);

  // Завантажуємо інформацію про останній слайд
  const loadLastSlideId = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await getUserCourseProgress(user.id, course.id);
      if (!error && data) {
        setLastSlideId(data.last_slide_id);
      }
    } catch (e) {
      console.warn('Failed to fetch user course progress:', e);
    }
  }, [user?.id, course.id]);

  // Зберігаємо прогрес у БД
  const saveProgress = useCallback(async (progress: number) => {
    if (!user?.id || progress < 0 || progress > 100) return;
    console.log('saveProgress')

    try {
      await supabase
        .from('user_course_summaries')
        .upsert(
          {
            user_id: user.id,
            course_id: course.id,
            progress: progress,
          },
          { onConflict: 'user_id,course_id' }
        );
    } catch (e) {
      console.warn('Failed to upsert course progress', e);
    }
  }, [user?.id, course.id]);

  // Завантажуємо дані при монтуванні
  useEffect(() => {
    loadCourseProgress();
    loadLastSlideId();
  }, [loadCourseProgress, loadLastSlideId, progressByModule]);

  // Зберігаємо прогрес з debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveProgress(courseProgress);
    }, 500);

    return () => clearTimeout(timeout);
  }, [courseProgress, saveProgress]);

  return {
    courseProgress,
    lastSlideId,
  };
};
