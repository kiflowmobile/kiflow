import { supabase } from '@/src/shared/lib/supabase';
import type { Criteria } from '../types';

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export const criteriaApi = {
  /**
   * Get criteria by course ID (or all criteria if not specified)
   */
  getCriteriaByCourse: async (
    courseId?: string
  ): Promise<ApiResponse<Criteria[]>> => {
    let query = supabase.from('criteria').select('*');

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    const { data, error } = await query;
    return { data: data as Criteria[] || [], error };
  },

  /**
   * Get criteria by ID
   */
  getCriteriaById: async (criteriaId: string): Promise<ApiResponse<Criteria>> => {
    const { data, error } = await supabase
      .from('criteria')
      .select('*')
      .eq('id', criteriaId)
      .single();

    return { data: data as Criteria, error };
  },

  /**
   * Get criteria by module ID
   */
  getCriteriaByModule: async (
    moduleId: string
  ): Promise<ApiResponse<Criteria[]>> => {
    const { data, error } = await supabase
      .from('criteria')
      .select('*')
      .eq('module_id', moduleId);

    return { data: data as Criteria[] || [], error };
  },
};
