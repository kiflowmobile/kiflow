import { supabase } from '@/src/config/supabaseClient';
import { Module } from '@/src/constants/types/modules';
import { create } from 'zustand';

interface ModulesState {
  // Стан
  modules: Module[];
  currentModule: Module | null;
  isLoading: boolean;
  error: string | null;
  
  // Дії
  fetchModulesByCourse: (courseId: string) => Promise<void>;
  setCurrentModule: (module: Module | null) => void;
  clearError: () => void;
  clearModules: () => void;
  
  // Внутрішні дії
  setModules: (modules: Module[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  getModule: (id: string) => Module | null;

}

export const useModulesStore = create<ModulesState>()(
  (set, get) => ({
    // Початковий стан
    modules: [],
    currentModule: null,
    isLoading: false,
    error: null,

    // Дії
    fetchModulesByCourse: async (courseId: string) => {
      set({ isLoading: true, error: null });
      
      try {
        const { data, error } = await supabase
          .from('modules')   
          .select('*')
          .eq('course_id', courseId)
          .order('module_order', { ascending: true });

        if (error) throw error;
        
        set({ 
          modules: data || [], 
          isLoading: false, 
          error: null 
        });
        
      } catch (error: any) {
        console.error('❌ ModulesStore: Error fetching modules:', error);
        set({ 
          error: error.message || 'Failed to fetch modules', 
          isLoading: false 
        });
        throw error;
      }
    },

    setCurrentModule: (module: Module | null) => {
      set({ currentModule: module });
    },

    clearError: () => set({ error: null }),

    clearModules: () => set({ 
      modules: [], 
      currentModule: null
    }),

    // Внутрішні дії
    setModules: (modules: Module[]) => set({ modules }),
    setLoading: (loading: boolean) => set({ isLoading: loading }),
    setError: (error: string | null) => set({ error }),
    getModule: (id: string) => {
      const module = get().modules.find(m => m.id === id);
      return module || null;
    },
  })
);