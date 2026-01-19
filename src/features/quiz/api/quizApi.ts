import { supabase, type ApiResponse } from '@/src/shared/lib/supabase';

export interface QuizInteractionRow {
  user_id: string;
  slide_id: string;
  interaction_type: 'quiz';
  data: {
    selected_answer: number;
    correct_answer: number;
  };
}

export interface QuizInteractionResult {
  slide_id: string;
  data: {
    selected_answer: number;
    correct_answer: number;
  };
  slides: {
    lessons: {
      modules: {
        course_id: string;
      };
    };
  };
}

export const quizApi = {
  /**
   * Sync quiz answers to the database
   */
  syncQuizAnswers: async (
    userId: string,
    rows: QuizInteractionRow[],
  ): Promise<ApiResponse<null>> => {
    if (rows.length === 0) {
      return { data: null, error: null };
    }

    const { error } = await supabase
      .from('user_slide_interactions')
      .upsert(rows as any, { onConflict: 'user_id,slide_id,interaction_type' });

    return { data: null, error };
  },

  /**
   * Fetch quiz interactions from the database for a user
   */
  fetchQuizInteractions: async (userId: string): Promise<ApiResponse<QuizInteractionResult[]>> => {
    const { data, error } = await supabase
      .from('user_slide_interactions')
      .select(
        `
        slide_id,
        data,
        slides!inner(
          lessons!inner(
            modules!inner(course_id)
          )
        )
      `,
      )
      .eq('user_id', userId)
      .eq('interaction_type', 'quiz');

    return { data: data as QuizInteractionResult[] | null, error };
  },
};
