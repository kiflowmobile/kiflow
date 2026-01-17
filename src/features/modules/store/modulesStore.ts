import { create } from 'zustand';
import { modulesApi } from '../api/modulesApi';
import type { Module, ModuleStore } from '../types';

export const useModulesStore = create<ModuleStore>()((set, get) => ({
  modules: [],
  currentModule: null,
  isLoading: false,
  error: null,

  fetchModulesByCourse: async (courseId: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await modulesApi.getModulesByCourse(courseId);

      if (error) throw error;

      set({
        modules: data || [],
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch modules';
      console.error('ModulesStore: Error fetching modules:', error);
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  fetchModulesByCourses: async (courseIds: string[]) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await modulesApi.getModulesByCourses(courseIds);

      if (error) throw error;

      set({
        modules: data || [],
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch modules';
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  // Backwards compatibility alias
  fetchMyModulesByCourses: async (courseIds: string[]) => {
    return get().fetchModulesByCourses(courseIds);
  },

  setCurrentModule: (module: Module | null) => {
    set({ currentModule: module });
  },

  setModules: (modules: Module[]) => set({ modules }),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setError: (error: string | null) => set({ error }),

  clearError: () => set({ error: null }),

  clearModules: () =>
    set({
      modules: [],
      currentModule: null,
    }),

  getModule: (id: string) => {
    const module = get().modules.find((m) => m.id === id);
    return module || null;
  },
}));
