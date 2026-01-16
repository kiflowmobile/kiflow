import { supabase } from '@/src/config/supabaseClient';

export interface QuizAnswer {
  user_id: string;
  course_id: string;
  module_id: string;
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
      course_id: a.course_id,
      module_id: a.module_id,
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
  async getAnswersByCourse(userId: string, courseId: string) {
    const { data, error } = await supabase
      .from('user_slide_interactions')
      .select('slide_id, course_id, module_id, data, created_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('interaction_type', 'quiz');
    if (error) throw new Error(error.message);

    // Transform to match old format for backwards compatibility
    return data?.map(item => ({
      user_id: userId,
      slide_id: item.slide_id,
      course_id: item.course_id,
      module_id: item.module_id,
      selected_answer: item.data?.selected_answer,
      correct_answer: item.data?.correct_answer,
      created_at: item.created_at
    }));
  },

  // 🟣 Видалити всі відповіді користувача для курсу (наприклад при reset)
  async deleteByCourse(userId: string, courseId: string) {
    const { error } = await supabase
      .from('user_slide_interactions')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('interaction_type', 'quiz');
    if (error) throw new Error(error.message);
  },
};
