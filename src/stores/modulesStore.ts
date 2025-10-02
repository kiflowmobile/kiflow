import { create } from 'zustand';
import { Module } from '@/src/constants/types/modules';
import { modulesService } from '../services/modules';

interface ModulesState {
  modules: Module[];
  currentModule: Module | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchModulesByCourse: (courseId: string) => Promise<void>;
  fetchMyModulesByCourses: (courseId: string[]) => Promise<void>;

  setCurrentModule: (module: Module | null) => void;
  clearError: () => void;
  clearModules: () => void;

  // Internal actions
  setModules: (modules: Module[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getModule: (id: string) => Module | null;
}

export const useModulesStore = create<ModulesState>()((set, get) => ({
  modules: [],
  currentModule: null,
  isLoading: false,
  error: null,

  // Actions
  fetchModulesByCourse: async (courseId: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await modulesService.getModulesByCourse(courseId);

      if (error) throw error;

      set({
        modules: data,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('❌ ModulesStore: Error fetching modules:', error);
      set({
        error: error.message || 'Failed to fetch modules',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchMyModulesByCourses: async (courseIds: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await modulesService.getMyModulesByCourses(courseIds);
      if (error) throw error;

      set({
        modules: data || [],
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch modules', isLoading: false });
    }
  },

  setCurrentModule: (module: Module | null) => {
    set({ currentModule: module });
  },

  clearError: () => set({ error: null }),

  clearModules: () =>
    set({
      modules: [],
      currentModule: null,
    }),

  // Internal actions
  setModules: (modules: Module[]) => set({ modules }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
  getModule: (id: string) => {
    const module = get().modules.find((m) => m.id === id);
    return module || null;
  },
}));
