// import { supabase } from '../config/supabaseClient';
// import { Module } from '../constants/types/modules';

// export const getModulesByCourse = async (courseId:string): Promise<{ data: Module[] | null; error: any }> => {
//   try {
//     const { data, error } = await supabase
//       .from('modules')   
//       .select('*')
//       .eq('course_id',courseId)
//       .order('module_order', { ascending: true });

//     return { data, error };
//   } catch (err) {
//     console.error('Error fetching courses:', err);
//     return { data: null, error: err };
//   }
// };
