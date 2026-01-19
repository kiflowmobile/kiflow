import { supabase, type ApiResponse } from '@/shared/lib/supabase';

export interface SlidePrompt {
  id: string;
  slide_id: string;
  system_instruction: string;
  initial_message: string | null;
  created_at: string;
  updated_at: string;
}

export const promptsApi = {
  /**
   * Get prompt by slide ID
   */
  getPromptBySlideId: async (slideId: string): Promise<ApiResponse<SlidePrompt>> => {
    try {
      const { data, error } = await supabase
        .from('slide_ai_prompts')
        .select('*')
        .eq('slide_id', slideId)
        .maybeSingle();

      return { data: data as SlidePrompt | null, error };
    } catch (err) {
      console.error('Error fetching prompt by slide id:', err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Get prompts by multiple slide IDs
   */
  getPromptsBySlideIds: async (slideIds: string[]): Promise<ApiResponse<SlidePrompt[]>> => {
    try {
      const { data, error } = await supabase
        .from('slide_ai_prompts')
        .select('*')
        .in('slide_id', slideIds);

      return { data: (data as SlidePrompt[]) || [], error };
    } catch (err) {
      console.error('Error fetching prompts by slide ids:', err);
      return { data: null, error: err as Error };
    }
  },
};
