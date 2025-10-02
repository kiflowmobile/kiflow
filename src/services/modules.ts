import { supabase } from '@/src/config/supabaseClient';
import { Module } from '@/src/constants/types/modules';

export const modulesService = {
  getModulesByCourse: async (courseId: string): Promise<{ data: Module[]; error: any }> => {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('module_order', { ascending: true });

    return { data: data || [], error };
  },

  getMyModulesByCourses: async (courseIds: string[]) => {
    if (courseIds.length === 0) {
      return { data: [], error: null };
    }

    return await supabase
      .from('modules')
      .select('*')
      .in('course_id', courseIds) // ✅ всі id за раз
      .order('module_order', { ascending: true });
  },
};

// export const myModulesService = {

//   };
