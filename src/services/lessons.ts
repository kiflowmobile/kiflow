import { supabase } from "../config/supabaseClient";

export const fetchLessonsByModule = async (moduleId: string) => {
    console.log('fetchLessonsByModule')
  return await supabase
    .from("lessons")
    .select("*")
    .eq("module_id", moduleId)
    .order("lesson_order", { ascending: true });
};