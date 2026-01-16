import { create } from 'zustand';
import { criteriaService } from '../services/criteriaService';
import { Criteria } from '../constants/types/criteria';

interface CriteriaState {
  criteria: Criteria[];
  // Backward compatibility alias
  criterias: Criteria[];
  isLoading: boolean;
  error: string | null;

  fetchCriteria: (courseId: string) => Promise<void>;
  fetchAllCriteria: () => Promise<void>;
  // Backward compatibility aliases
  fetchCriterias: (courseId: string) => Promise<void>;
  fetchAllCriterias: () => Promise<void>;
  clear: () => void;
}

export const useCriteriaStore = create<CriteriaState>((set, get) => ({
  criteria: [],
  // Backward compatibility - criterias points to same array
  get criterias() {
    return get().criteria;
  },
  isLoading: false,
  error: null,

  fetchCriteria: async (courseId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await criteriaService.getCriteriaByCourse(courseId);
      if (error) throw error;

      set({ criteria: data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch criteria', isLoading: false });
    }
  },

  fetchAllCriteria: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await criteriaService.getCriteriaByCourse();
      if (error) throw error;

      set({ criteria: data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch criteria', isLoading: false });
    }
  },

  // Backward compatibility aliases
  fetchCriterias: async (courseId: string) => {
    return get().fetchCriteria(courseId);
  },

  fetchAllCriterias: async () => {
    return get().fetchAllCriteria();
  },

  clear: () => set({ criteria: [], error: null }),
}));
