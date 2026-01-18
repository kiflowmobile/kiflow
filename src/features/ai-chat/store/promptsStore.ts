import { create } from 'zustand';
import { promptsApi } from '../api/promptsApi';
import type { SlidePrompt } from '../api/promptsApi';

export interface PromptsStore {
  prompt: Record<string, SlidePrompt>;
  isLoading: boolean;
  error: string | null;
  fetchPromptBySlide: (slideId: string) => Promise<void>;
  fetchPromptsBySlides: (slideIds: string[]) => Promise<void>;
  clearError: () => void;
}

export const usePromptsStore = create<PromptsStore>()((set, get) => ({
  prompt: {},
  isLoading: false,
  error: null,

  fetchPromptBySlide: async (slideId: string) => {
    if (!slideId) return;

    // Check if already fetched
    if (get().prompt[slideId]) return;

    set({ isLoading: true, error: null });

    try {
      const { data, error } = await promptsApi.getPromptBySlideId(slideId);

      if (error) throw error;

      if (data) {
        set((state) => ({
          prompt: { ...state.prompt, [slideId]: data },
          isLoading: false,
          error: null,
        }));
      } else {
        set({ isLoading: false });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prompt';
      console.error('PromptsStore: Error fetching prompt:', err);
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchPromptsBySlides: async (slideIds: string[]) => {
    if (!slideIds || slideIds.length === 0) return;

    set({ isLoading: true, error: null });

    try {
      const { data, error } = await promptsApi.getPromptsBySlideIds(slideIds);

      if (error) throw error;

      if (data) {
        const promptsMap: Record<string, SlidePrompt> = {};
        data.forEach((prompt) => {
          promptsMap[prompt.slide_id] = prompt;
        });

        set((state) => ({
          prompt: { ...state.prompt, ...promptsMap },
          isLoading: false,
          error: null,
        }));
      } else {
        set({ isLoading: false });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prompts';
      console.error('PromptsStore: Error fetching prompts:', err);
      set({ error: errorMessage, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
