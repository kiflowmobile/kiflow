import { supabase, type ApiResponse } from '@/src/shared/lib/supabase';
import type { Lesson } from '../types';

export const lessonsApi = {
  /**
   * Get all lessons for a module, ordered by lesson_order
   */
  fetchLessonsByModule: async (moduleId: string): Promise<ApiResponse<Lesson[]>> => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('lesson_order', { ascending: true });

    return { data: data || [], error };
  },

  /**
   * Get a lesson by ID
   */
  getLessonById: async (lessonId: string): Promise<ApiResponse<Lesson>> => {
    const { data, error } = await supabase.from('lessons').select('*').eq('id', lessonId).single();

    return { data, error };
  },

  /**
   * Get lesson ID from a slide ID
   */
  getLessonIdBySlideId: async (slideId: string): Promise<ApiResponse<{ lesson_id: string }>> => {
    const { data, error } = await supabase
      .from('slides')
      .select('lesson_id')
      .eq('id', slideId)
      .single();

    return { data, error };
  },

  /**
   * Get lesson order from a slide ID
   */
  getLessonOrderBySlideId: async (
    slideId: string,
  ): Promise<ApiResponse<{ lesson_order: number }>> => {
    // First get the lesson_id from the slide
    const slideRes = (await supabase
      .from('slides')
      .select('lesson_id')
      .eq('id', slideId)
      .single()) as { data: { lesson_id: string } | null; error: any };

    if (slideRes.error || !slideRes.data) {
      return { data: null, error: slideRes.error };
    }

    // Then get the lesson_order from the lesson
    const lessonId = slideRes.data.lesson_id;
    if (!lessonId) {
      return { data: null, error: new Error('Lesson ID not found') };
    }

    const { data, error } = await supabase
      .from('lessons')
      .select('lesson_order')
      .eq('id', lessonId)
      .single();

    return { data, error };
  },

  /**
   * Get lesson counts for multiple modules
   */
  fetchLessonCountsByModuleIds: async (
    moduleIds: string[],
  ): Promise<ApiResponse<Record<string, number>>> => {
    if (!moduleIds || moduleIds.length === 0) {
      return { data: {}, error: null };
    }

    const { data, error } = await supabase
      .from('lessons')
      .select('module_id')
      .in('module_id', moduleIds);

    if (error) return { data: {}, error };

    const counts: Record<string, number> = {};
    (data || []).forEach((r: any) => {
      const mid = r.module_id;
      counts[mid] = (counts[mid] || 0) + 1;
    });

    return { data: counts, error: null };
  },
};
