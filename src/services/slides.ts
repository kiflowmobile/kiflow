// import { supabase } from '../config/supabaseClient';
// import { Slide } from '../constants/types/slides';

// export const getSlidesByModule = async (moduleId: string): Promise<{ data: Slide[] | null; error: any }> => {
//     try {
//       const { data, error } = await supabase
//         .from('slides')
//         .select('*')
//         .eq('module_id', moduleId)
//         .order('slide_order', { ascending: true });   
//       return { data, error };
//     } catch (err) {
//       console.error('Error fetching slides:', err);
//       return { data: null, error: err };
//     }
//   };