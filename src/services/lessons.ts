import { supabase } from '../config/supabaseClient';

export const fetchLessonsByModule = async (moduleId: string) => {
  return await supabase
    .from('lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('lesson_order', { ascending: true });
};

export const getLessonIdBySlideId = async (lastSlideId: string) => {
  return await supabase.from('slides').select('lesson_id').eq('id', lastSlideId).single();
};

export const getLessonById = async (lessonId: string) => {
  return await supabase.from('lessons').select('*').eq('id', lessonId).single();
};

export const getLessonOrderBySlideId = async (slideId: string) => {
  const slideRes = await supabase.from('slides').select('lesson_id').eq('id', slideId).single();

  if (slideRes.error || !slideRes.data) {
    return slideRes; 
  }

  return await supabase
    .from('lessons')
    .select('lesson_order')
    .eq('id', slideRes.data.lesson_id)
    .single();
};

export const fetchLessonCountsByModuleIds = async (moduleIds: string[]) => {
  if (!moduleIds || moduleIds.length === 0) {
    return { data: {}, error: null };
  }

  const { data, error } = await supabase
    .from('lessons')
    .select('module_id')
    .in('module_id', moduleIds);

  if (error) return { data: {}, error };

  const counts: Record<string, number> = {};
  (data || []).forEach((r: any) => {
    const mid = r.module_id;
    counts[mid] = (counts[mid] || 0) + 1;
  });

  return { data: counts, error: null };
};
