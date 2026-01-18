import { supabase } from '@/src/shared/lib/supabase';
import type { Slide, Lesson } from '../types';

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export const slidesApi = {
  /**
   * Get all slides for given lessons, ordered by slide_order
   */
  fetchSlidesByLessons: async (lessons: Lesson[]): Promise<ApiResponse<Slide[]>> => {
    if (!lessons || lessons.length === 0) {
      return { data: [], error: null };
    }

    const lessonIds = lessons.map((l) => l.id);

    const { data, error } = await supabase
      .from('slides')
      .select('*')
      .in('lesson_id', lessonIds)
      .order('slide_order', { ascending: true });

    return { data: (data as Slide[]) || [], error };
  },

  /**
   * Get a single slide by ID
   */
  getSlideById: async (slideId: string): Promise<ApiResponse<Slide>> => {
    const { data, error } = await supabase.from('slides').select('*').eq('id', slideId).single();

    return { data: (data ?? null) as Slide | null, error };
  },

  /**
   * Get slides for a specific lesson
   */
  fetchSlidesByLesson: async (lessonId: string): Promise<ApiResponse<Slide[]>> => {
    const { data, error } = await supabase
      .from('slides')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('slide_order', { ascending: true });

    return { data: (data as Slide[]) || [], error };
  },

  /**
   * Get slide count for a lesson
   */
  getSlideCountByLesson: async (lessonId: string): Promise<ApiResponse<number>> => {
    const { count, error } = await supabase
      .from('slides')
      .select('*', { count: 'exact', head: true })
      .eq('lesson_id', lessonId);

    return { data: count, error };
  },
};
