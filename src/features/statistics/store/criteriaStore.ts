import { create } from 'zustand';
import { criteriaApi } from '../api/criteriaApi';
import type { CriteriaStore, CriteriaState } from '../types';

// Extended state with backwards compatibility
interface CriteriaStoreWithCompat extends CriteriaStore {
  // Backwards compatibility - criterias as alias for criteria
  criterias: CriteriaState['criteria'];
}

export const useCriteriaStore = create<CriteriaStoreWithCompat>()((set, get) => ({
  criteria: [],
  // Backwards compatibility getter
  get criterias() {
    return get().criteria;
  },
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

  // Backwards compatibility aliases
  fetchCriterias: async (courseId: string) => {
    return get().fetchCriteria(courseId);
  },

  fetchAllCriterias: async () => {
    return get().fetchAllCriteria();
  },

  clear: () => set({ criteria: [], error: null }),
}));
