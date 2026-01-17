// Re-export from new location for backwards compatibility
// TODO: Update imports to use @/src/features/statistics directly
import { useCriteriaStore as _useCriteriaStore } from '@/src/features/statistics';

export const useCriteriaStore = _useCriteriaStore;
