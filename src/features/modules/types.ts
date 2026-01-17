export interface Module {
  id: string;
  title: string;
  description: string | null;
  course_id: string;
  created_at: string;
  module_order: number | null;
}

export interface ModuleState {
  modules: Module[];
  currentModule: Module | null;
  isLoading: boolean;
  error: string | null;
}

export interface ModuleActions {
  fetchModulesByCourse: (courseId: string) => Promise<void>;
  fetchModulesByCourses: (courseIds: string[]) => Promise<void>;
  // Backwards compatibility alias
  fetchMyModulesByCourses: (courseIds: string[]) => Promise<void>;
  setCurrentModule: (module: Module | null) => void;
  setModules: (modules: Module[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearModules: () => void;
  getModule: (id: string) => Module | null;
}

export type ModuleStore = ModuleState & ModuleActions;
