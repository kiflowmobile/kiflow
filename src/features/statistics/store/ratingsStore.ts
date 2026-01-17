import { create } from 'zustand';
import { ratingsApi } from '../api/ratingsApi';
import type { SkillRatingsStore, SkillSummaryItem } from '../types';

export const useUserSkillRatingsStore = create<SkillRatingsStore>((set, get) => ({
  average: null,
  ratings: [],
  skills: [],
  isLoading: false,
  error: null,

  fetchAverage: async (userId, moduleId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await ratingsApi.fetchRatings(userId, moduleId);
      if (error) throw error;

      const total = data?.reduce((sum, item) => sum + (item.rating || 0), 0) ?? 0;
      const avg = data && data.length > 0 ? total / data.length : null;

      set({ average: avg, isLoading: false });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch average';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchSkills: async (userId, moduleId) => {
    set({ isLoading: true, error: null });
    try {
      const { data: ratings, error: ratingsError } = await ratingsApi.fetchRatings(
        userId,
        moduleId
      );
      if (ratingsError) throw ratingsError;

      const keys = ratings?.map((r) => r.criteria_key) ?? [];
      const { data: criteria, error: criteriaError } =
        await ratingsApi.fetchCriteriaByKeys(keys);
      if (criteriaError) throw criteriaError;

      const skills: SkillSummaryItem[] =
        ratings?.map((r) => {
          const criterion = criteria?.find((c) => c.key === r.criteria_key);
          return {
            criterion_id: r.criteria_key,
            criterion_name: criterion?.name || r.criteria_key,
            average_score: r.rating || 0,
          };
        }) ?? [];

      set({ skills, isLoading: false });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch skills';
      set({ error: errorMessage, isLoading: false });
    }
  },

  saveRating: async (userId, rating, moduleId, key) => {
    try {
      const { data: existing, error: fetchError } = await ratingsApi.fetchRating(
        userId,
        moduleId,
        key
      );
      if (fetchError && (fetchError as any).code !== 'PGRST116') throw fetchError;

      const normalized = typeof rating === 'string' ? parseInt(rating, 10) : rating;
      const final = existing ? (existing.rating + normalized) / 2 : normalized;

      await ratingsApi.upsertRating(userId, final, moduleId, key);

      await get().fetchAverage(userId, moduleId);
      await get().fetchSkills(userId, moduleId);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save rating';
      set({ error: errorMessage });
    }
  },

  fetchUserAverage: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await ratingsApi.fetchAllRatings(userId);
      if (error) throw error;

      const total = data?.reduce((sum, item) => sum + (item.rating || 0), 0) ?? 0;
      const avg = data && data.length > 0 ? total / data.length : null;

      set({ average: avg, isLoading: false });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch user average';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchUserRatings: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await ratingsApi.fetchAllRatings(userId);
      if (error) throw error;

      set({ ratings: data || [], isLoading: false });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch user ratings';
      set({ error: errorMessage, isLoading: false });
    }
  },

  clear: () => set({ average: null, ratings: [], skills: [], error: null }),
}));

// Backwards compatibility alias
export const useMainRatingStore = useUserSkillRatingsStore;
