import { supabase } from '@/src/config/supabaseClient';
import { Criteria } from '../constants/types/criteria';

export const criteriaService = {
  getCriteriasByCourse: async (
    courseId?: string
  ): Promise<{ data: Criteria[] | null; error: any }> => {
    let query = supabase.from('criterias').select('*');

    if (courseId) {
      query = query.eq('course_id', courseId);
    }

    return await query;
  },
};