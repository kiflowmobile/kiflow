// Re-export from new location for backwards compatibility
// TODO: Update imports to use @/src/features/statistics directly
import { criteriaApi } from '@/src/features/statistics';

export const criteriaService = {
  getCriteriaByCourse: criteriaApi.getCriteriaByCourse,
  getCriteriasByCourse: criteriaApi.getCriteriaByCourse,
};