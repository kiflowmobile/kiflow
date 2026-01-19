import { supabase } from '@/src/shared/lib/supabase';
import type { UserModuleProgressDB } from '../types';

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export const progressApi = {
  /**
   * Get user's module progress from DB
   */
  getUserModuleProgress: async (userId: string): Promise<ApiResponse<UserModuleProgressDB[]>> => {
    const { data, error } = await supabase
      .from('user_module_progress')
      .select('*')
      .eq('user_id', userId);

    return { data: data || [], error };
  },

  /**
   * Upsert module progress in DB
   */
  upsertModuleProgress: async (
    userId: string,
    moduleId: string,
    progress: number,
    lastSlideId: string | null,
  ): Promise<ApiResponse<UserModuleProgressDB>> => {
    const { data, error } = await supabase
      .from('user_module_progress')
      .upsert({
        user_id: userId,
        module_id: moduleId,
        progress,
        last_slide_id: lastSlideId,
      } as any)
      .select()
      .single();

    return { data, error };
  },

  /**
   * Get user's course progress summary from view
   */
  getUserCourseProgressView: async (
    userId: string,
  ): Promise<
    ApiResponse<
      Array<{
        user_id: string;
        course_id: string;
        progress: number;
      }>
    >
  > => {
    const { data, error } = await supabase
      .from('user_course_progress_view')
      .select('*')
      .eq('user_id', userId);

    return { data: data || [], error };
  },

  /**
   * Delete module progress for a specific module
   */
  deleteModuleProgress: async (userId: string, moduleId: string): Promise<ApiResponse<null>> => {
    const { error } = await supabase
      .from('user_module_progress')
      .delete()
      .eq('user_id', userId)
      .eq('module_id', moduleId);

    return { data: null, error };
  },

  /**
   * Delete all module progress for modules in a course
   */
  deleteProgressForCourse: async (
    userId: string,
    moduleIds: string[],
  ): Promise<ApiResponse<null>> => {
    if (moduleIds.length === 0) {
      return { data: null, error: null };
    }

    const { error } = await supabase
      .from('user_module_progress')
      .delete()
      .eq('user_id', userId)
      .in('module_id', moduleIds);

    return { data: null, error };
  },
};
