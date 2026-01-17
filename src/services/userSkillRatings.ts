// Re-export from new location for backwards compatibility
// TODO: Update imports to use @/src/features/statistics directly
import { ratingsApi } from '@/src/features/statistics';

// Legacy function exports for backwards compatibility
export const fetchRatings = ratingsApi.fetchRatings;
export const fetchRating = ratingsApi.fetchRating;
export const upsertRating = ratingsApi.upsertRating;
export const fetchAllRatings = ratingsApi.fetchAllRatings;
export const fetchCriteriaByKeys = ratingsApi.fetchCriteriaByKeys;
export const getAverageUserRating = ratingsApi.getAverageUserRating;
export const getUserSkillsSummary = ratingsApi.getUserSkillsSummary;
