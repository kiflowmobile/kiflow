// Re-export from new location for backwards compatibility
// TODO: Update imports to use @/src/features/statistics directly
import {
  useUserSkillRatingsStore as _useUserSkillRatingsStore,
  useMainRatingStore as _useMainRatingStore,
} from '@/src/features/statistics';

export const useUserSkillRatingsStore = _useUserSkillRatingsStore;
export const useMainRatingStore = _useMainRatingStore;
