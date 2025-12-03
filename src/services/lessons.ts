import { supabase } from "../config/supabaseClient";

export const fetchLessonsByModule = async (moduleId: string) => {
  return await supabase
    .from("lessons")
    .select("*")
    .eq("module_id", moduleId)
    .order("lesson_order", { ascending: true });
};


export const getLessonIdBySlideId = async (lastSlideId: string) => {
  return await supabase
    .from('slides')
    .select('lesson_id')
    .eq('id', lastSlideId)
    .single();
};