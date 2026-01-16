import { supabase } from '@/src/config/supabaseClient';
import { Criteria } from '../constants/types/criteria';

export const criteriaService = {
  getCriteriaByCourse: async (
    courseId?: string
  ): Promise<{ data: Criteria[] | null; error: any }> => {
    let query = supabase.from('criteria').select('*');

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    return await query;
  },

  // Backwards compatibility alias
  getCriteriasByCourse: async (courseId?: string) => {
    return criteriaService.getCriteriaByCourse(courseId);
  },
};