import { useCallback } from 'react';
import { useModulesStore } from '../store/modulesStore';
import type { Module } from '../types';

/**
 * Hook to access modules state and actions
 */
export function useModules() {
  const modules = useModulesStore((state) => state.modules);
  const currentModule = useModulesStore((state) => state.currentModule);
  const isLoading = useModulesStore((state) => state.isLoading);
  const error = useModulesStore((state) => state.error);

  const fetchModulesByCourse = useModulesStore(
    (state) => state.fetchModulesByCourse
  );
  const fetchModulesByCourses = useModulesStore(
    (state) => state.fetchModulesByCourses
  );
  const setCurrentModule = useModulesStore((state) => state.setCurrentModule);
  const clearError = useModulesStore((state) => state.clearError);
  const clearModules = useModulesStore((state) => state.clearModules);
  const getModule = useModulesStore((state) => state.getModule);

  return {
    // State
    modules,
    currentModule,
    isLoading,
    error,

    // Actions
    fetchModulesByCourse,
    fetchModulesByCourses,
    setCurrentModule,
    clearError,
    clearModules,
    getModule,
  };
}

/**
 * Hook to get a single module by ID
 */
export function useModule(moduleId: string | undefined) {
  const modules = useModulesStore((state) => state.modules);
  const currentModule = useModulesStore((state) => state.currentModule);

  const module = moduleId
    ? currentModule?.id === moduleId
      ? currentModule
      : modules.find((m) => m.id === moduleId)
    : null;

  return { module };
}

/**
 * Hook to get modules filtered by course ID
 */
export function useModulesByCourse(courseId: string | undefined) {
  const modules = useModulesStore((state) => state.modules);

  const courseModules = courseId
    ? modules.filter((m) => m.course_id === courseId)
    : [];

  return { modules: courseModules };
}
