import { supabase } from '@/src/shared/lib/supabase';
import type { Module } from '../types';

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export const modulesApi = {
  /**
   * Get all modules for a course, ordered by module_order
   */
  getModulesByCourse: async (courseId: string): Promise<ApiResponse<Module[]>> => {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('module_order', { ascending: true });

    return { data: data || [], error };
  },

  /**
   * Get all modules for multiple courses
   */
  getModulesByCourses: async (courseIds: string[]): Promise<ApiResponse<Module[]>> => {
    if (courseIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .in('course_id', courseIds)
      .order('module_order', { ascending: true });

    return { data: data || [], error };
  },

  /**
   * Get a single module by ID
   */
  getModuleById: async (moduleId: string): Promise<ApiResponse<Module>> => {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .single();

    return { data, error };
  },

  /**
   * Get the module ID for a given lesson
   */
  getModuleIdByLessonId: async (
    lessonId: string
  ): Promise<ApiResponse<{ module_id: string }>> => {
    const { data, error } = await supabase
      .from('lessons')
      .select('module_id')
      .eq('id', lessonId)
      .single();

    return { data, error };
  },
};
