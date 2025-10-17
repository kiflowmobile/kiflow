import { supabase } from '@/src/config/supabaseClient';

export interface QuizAnswer {
  user_id: string;
  course_id: string;
  module_id: string;
  question_id: string;
  selected_answer: number;
  correct_answer: number;
  created_at?: string;
}

export const quizService = {
  // 🟢 Зберегти кілька відповідей одразу
  async saveAnswers(answers: QuizAnswer[]) {
    const { error } = await supabase.from('quiz_answers').insert(answers);
    if (error) throw new Error(error.message);
  },

  // 🔵 Отримати всі відповіді користувача по курсу
  async getAnswersByCourse(userId: string, courseId: string) {
    const { data, error } = await supabase
      .from('quiz_answers')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId);
    if (error) throw new Error(error.message);
    return data;
  },

  // 🟣 Видалити всі відповіді користувача для курсу (наприклад при reset)
  async deleteByCourse(userId: string, courseId: string) {
    const { error } = await supabase
      .from('quiz_answers')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId);
    if (error) throw new Error(error.message);
  },
};
