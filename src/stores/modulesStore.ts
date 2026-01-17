// Re-export from new location for backwards compatibility
// TODO: Update imports to use @/src/features/modules directly
import { useModulesStore as _useModulesStore } from '@/src/features/modules';

export const useModulesStore = _useModulesStore;

// Legacy alias for fetchMyModulesByCourses (renamed to fetchModulesByCourses)
// Components using fetchMyModulesByCourses should update to use fetchModulesByCourses
