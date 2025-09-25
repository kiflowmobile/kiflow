import { supabase } from '@/src/config/supabaseClient';
import { create } from 'zustand';

interface Criteria {
  id: string;
  course_id: string;
  name: string;
  key: string;
  description: string;
}

interface CriteriaState {
  criterias: Criteria[];
  isLoading: boolean;
  error: string | null;

  fetchCriterias: (courseId: string) => Promise<void>;
  clear: () => void;
}

export const useCriteriaStore = create<CriteriaState>((set) => ({
  criterias: [],
  isLoading: false,
  error: null,

  fetchCriterias: async (courseId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('criterias')
        .select('*')
        .eq('course_id', courseId);

      if (error) throw error;

      set({ criterias: data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch criterias', isLoading: false });
    }
  },

  clear: () => set({ criterias: [], error: null }),
}));
