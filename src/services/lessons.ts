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

// Получить запись урока по id урока
export const getLessonById = async (lessonId: string) => {
  return await supabase.from('lessons').select('*').eq('id', lessonId).single();
};

// Удобный helper: вернуть lesson_order (номер урока) по id слайда
export const getLessonOrderBySlideId = async (slideId: string) => {
  // сначала получаем lesson_id из таблицы slides
  const slideRes = await supabase.from('slides').select('lesson_id').eq('id', slideId).single();

  if (slideRes.error || !slideRes.data) {
    return slideRes; // содержит error
  }

  // затем получаем lesson_order из lessons
  return await supabase
    .from('lessons')
    .select('lesson_order')
    .eq('id', slideRes.data.lesson_id)
    .single();
};
