import { create } from 'zustand';
import { criteriaApi } from '../api/criteriaApi';
import type { CriteriaStore } from '../types';

export const useCriteriaStore = create<CriteriaStore>()((set) => ({
  criteria: [],
  isLoading: false,
  error: null,

  fetchCriteria: async (courseId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await criteriaApi.getCriteriaByCourse(courseId);
      if (error) throw error;

      set({ criteria: data || [], isLoading: false });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch criteria';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchAllCriteria: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await criteriaApi.getCriteriaByCourse();
      if (error) throw error;

      set({ criteria: data || [], isLoading: false });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch criteria';
      set({ error: errorMessage, isLoading: false });
    }
  },

  clear: () => set({ criteria: [], error: null }),
}));
