import { create } from 'zustand';
import {
  fetchAllRatings,
  fetchCriteriasByKeys,
  fetchRating,
  fetchRatings,
  fetchRatingsByLesson,
  getUserSkillsSummaryByLesson,
  upsertRating,
} from '../services/main_rating';

interface RatingItem {
  id: string;
  user_id: string;
  module_id: string;
  criteria_key: string;
  rating: number;
}

interface SkillSummaryItem {
  criterion_id: string;
  criterion_name: string;
  average_score: number;
}

interface MainRatingState {
  average: number | null;
  ratings: RatingItem[];
  skills: SkillSummaryItem[];
  isLoading: boolean;
  error: string | null;

  fetchAverage: (userId: string, moduleId: string) => Promise<void>;
  fetchSkills: (userId: string, moduleId: string) => Promise<void>;
  fetchAverageByLesson: (userId: string, lessonId: string) => Promise<number | null>;
  fetchSkillsByLesson: (userId: string, lessonId: string) => Promise<SkillSummaryItem[]>;
  saveRating: (
    userId: string,
    rating: number,
    moduleId: string,
    key: string,
    courseId: string,
    lessonId: string,
  ) => Promise<void>;
  fetchUserAverage: (userId: string) => Promise<void>;
  fetchUserRatings: (userId: string) => Promise<void>;
}

export const useMainRatingStore = create<MainRatingState>((set) => ({
  average: null,
  ratings: [],
  skills: [],
  isLoading: false,
  error: null,

  fetchAverage: async (userId, moduleId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await fetchRatings(userId, moduleId);
      if (error) throw error;

      const total = data?.reduce((sum, item) => sum + (item.rating || 0), 0) ?? 0;
      const avg = data && data.length > 0 ? total / data.length : null;

      set({ average: avg, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchSkills: async (userId, moduleId) => {
    set({ isLoading: true, error: null });
    try {
      const { data: ratings, error: ratingsError } = await fetchRatings(userId, moduleId);
      if (ratingsError) throw ratingsError;

      const keys = ratings?.map((r: any) => r.criteria_key) ?? [];
      const { data: criterias, error: criteriasError } = await fetchCriteriasByKeys(keys);
      if (criteriasError) throw criteriasError;

      const skills: SkillSummaryItem[] =
        ratings?.map((r: any) => {
          const criterion = criterias?.find((c) => c.key === r.criteria_key);
          return {
            criterion_id: r.criteria_key,
            criterion_name: criterion?.name || r.criteria_key,
            average_score: r.rating || 0,
          };
        }) ?? [];

      set({ skills, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchAverageByLesson: async (userId, lessonId) => {
    try {
      const { data, error } = await fetchRatingsByLesson(userId, lessonId);
      if (error) {
        console.error('[mainRatingStore] Error fetching ratings by lesson:', error);
        throw error;
      }
      if (!data || data.length === 0) {
        return null;
      }

      const total = data.reduce((sum, item) => sum + (item.rating || 0), 0);
      const avg = total / data.length;
      return avg;
    } catch (err: any) {
      console.error('[mainRatingStore] Error fetching average by lesson:', err);
      return null;
    }
  },

  fetchSkillsByLesson: async (userId, lessonId) => {
    try {
      const { data, error } = await getUserSkillsSummaryByLesson(userId, lessonId);
      if (error) {
        console.error('[mainRatingStore] Error fetching skills by lesson:', error);
        throw error;
      }
      if (!data) {
        return [];
      }

      const result = data.map((item: any) => ({
        criterion_id: item.criterion_key,
        criterion_name: item.criterion_name,
        average_score: item.average_score,
      }));
      return result;
    } catch (err: any) {
      console.error('[mainRatingStore] Error fetching skills by lesson:', err);
      return [];
    }
  },

  saveRating: async (userId, rating, moduleId, key, courseId, lessonId) => {
    try {
      const { data: existing, error: fetchError } = await fetchRating(
        userId,
        moduleId,
        key,
        lessonId,
      );
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const normalized = typeof rating === 'string' ? parseInt(rating, 10) : rating;
      const final = existing ? (existing.rating + normalized) / 2 : normalized;

      await upsertRating(userId, final, moduleId, key, courseId, lessonId);

      await useMainRatingStore.getState().fetchAverage(userId, moduleId);
      await useMainRatingStore.getState().fetchSkills(userId, moduleId);
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchUserAverage: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await fetchAllRatings(userId);
      if (error) throw error;

      const total = data?.reduce((sum, item) => sum + (item.rating || 0), 0) ?? 0;
      const avg = data && data.length > 0 ? total / data.length : null;

      set({ average: avg, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchUserRatings: async (userId) => {
    // 🔥 новий метод

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await fetchAllRatings(userId);
      if (error) throw error;

      set({ ratings: data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
}));
