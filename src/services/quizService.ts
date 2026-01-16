import { supabase } from '@/src/config/supabaseClient';

export interface QuizAnswer {
  user_id: string;
  slide_id: string;
  selected_answer: number;
  correct_answer: number;
  created_at?: string;
}

export const quizService = {
  // 🟢 Зберегти кілька відповідей одразу
  async saveAnswers(answers: QuizAnswer[]) {
    const rows = answers.map(a => ({
      user_id: a.user_id,
      slide_id: a.slide_id,
      interaction_type: 'quiz',
      data: {
        selected_answer: a.selected_answer,
        correct_answer: a.correct_answer
      }
    }));

    const { error } = await supabase
      .from('user_slide_interactions')
      .upsert(rows, { onConflict: 'user_id,slide_id,interaction_type' });
    if (error) throw new Error(error.message);
  },

  // 🔵 Отримати всі відповіді користувача по курсу
  // Uses join through slides -> lessons -> modules to filter by course_id
  async getAnswersByCourse(userId: string, courseId: string) {
    const { data, error } = await supabase
      .from('user_slide_interactions')
      .select(`
        slide_id,
        data,
        created_at,
        slides!inner(
          lessons!inner(
            modules!inner(course_id)
          )
        )
      `)
      .eq('user_id', userId)
      .eq('slides.lessons.modules.course_id', courseId)
      .eq('interaction_type', 'quiz');
    if (error) throw new Error(error.message);

    // Transform to flat format
    return data?.map(item => ({
      user_id: userId,
      slide_id: item.slide_id,
      selected_answer: item.data?.selected_answer,
      correct_answer: item.data?.correct_answer,
      created_at: item.created_at
    }));
  },

  // 🟣 Видалити всі відповіді користувача для курсу (наприклад при reset)
  // First gets slide_ids for the course, then deletes by those ids
  async deleteByCourse(userId: string, courseId: string) {
    // Get all slide_ids for this course
    const { data: slides, error: slidesError } = await supabase
      .from('slides')
      .select('id, lessons!inner(modules!inner(course_id))')
      .eq('lessons.modules.course_id', courseId);

    if (slidesError) throw new Error(slidesError.message);
    if (!slides || slides.length === 0) return;

    const slideIds = slides.map(s => s.id);

    const { error } = await supabase
      .from('user_slide_interactions')
      .delete()
      .eq('user_id', userId)
      .in('slide_id', slideIds)
      .eq('interaction_type', 'quiz');
    if (error) throw new Error(error.message);
  },
};
