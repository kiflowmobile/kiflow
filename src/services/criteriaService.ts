import { supabase } from '@/src/config/supabaseClient';
import { Criteria } from '../constants/types/criteria';

export const criteriaService = {
  getCriteriasByCourse: async (courseId: string): Promise<{ data: Criteria[] | null; error: any }> => {
    return await supabase
      .from('criterias')
      .select('*')
      .eq('course_id', courseId);
  },
};
