import { supabase } from "../config/supabaseClient";

export const initUserProgress = async (userId: string) => {
  try {
    // 1️⃣ Перевіряємо, чи вже є записи для користувача
    const { data: existing, error: checkError } = await supabase
      .from('user_course_summaries')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      console.log('✅ user_course_summaries already exists for user');
      return; // Не дублюємо
    }

    // 2️⃣ Отримуємо всі курси
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id');

    if (coursesError) throw coursesError;

    // 3️⃣ Отримуємо всі модулі
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, course_id');

    if (modulesError) throw modulesError;

    // 4️⃣ Формуємо структуру
    const progressRows = (courses || []).map(course => ({
      user_id: userId,
      course_id: course.id,
      progress: 0,
      last_slide_id: null,
      modules: (modules || [])
        .filter(m => m.course_id === course.id)
        .map(m => ({
          module_id: m.id,
          progress: 0,
          last_slide_id: null,
        })),
    }));

    // 5️⃣ Вставляємо в БД
    if (progressRows.length > 0) {
      const { error: insertError } = await supabase
        .from('user_course_summaries')
        .upsert(progressRows, { onConflict: 'user_id,course_id' });

      if (insertError) throw insertError;
    }

    console.log('🎉 User progress initialized successfully');
  } catch (err: any) {
    console.error('❌ Error initializing user progress:', err.message);
  }
};
