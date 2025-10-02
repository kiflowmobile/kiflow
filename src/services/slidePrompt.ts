import { supabase } from '@/src/config/supabaseClient';
import { create } from 'zustand';

interface Prompt {
  slide_id: string;
  prompt: string;
  question: string;
}

interface PromptsState {
  prompt: Record<string, Prompt>;
  isLoading: boolean;
  error: string | null;

  fetchPromptBySlide: (slideId: string) => Promise<void>;
}

export const usePromptsStore = create<PromptsState>((set) => ({
  prompt: {},
  isLoading: false,
  error: null,

  fetchPromptBySlide: async (slideId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('slide_ai_prompts')
        .select('slide_id, prompt, question')
        .eq('slide_id', slideId)
        .single();

      if (error) throw error;

      if (data) {
        set((state) => ({
          prompt: {
            ...state.prompt,
            [slideId]: {
              slide_id: data.slide_id,
              question: data.question,
              prompt: data.prompt,
            },
          },
          isLoading: false,
        }));
      }
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
}));
