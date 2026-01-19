import { supabase, type ApiResponse } from '@/src/shared/lib/supabase';
import type { RatingItem, SkillSummaryItem } from '../types';

export const ratingsApi = {
  /**
   * Fetch ratings for a user and module
   */
  fetchRatings: async (
    userId: string,
    moduleId: string,
  ): Promise<ApiResponse<Array<{ criteria_id: string; rating: number }>>> => {
    const { data, error } = await supabase
      .from('user_criteria_ratings')
      .select('criteria_id, rating')
      .eq('user_id', userId)
      .eq('module_id', moduleId);

    return { data: data || [], error };
  },

  /**
   * Fetch a specific rating
   */
  fetchRating: async (
    userId: string,
    moduleId: string,
    key: string,
  ): Promise<ApiResponse<{ rating: number }>> => {
    const { data, error } = await supabase
      .from('user_criteria_ratings')
      .select('rating')
      .eq('user_id', userId)
      .eq('criteria_id', key)
      .eq('module_id', moduleId ?? null)
      .single();

    return { data, error };
  },

  /**
   * Insert or update a rating
   */
  upsertRating: async (
    userId: string,
    rating: number,
    moduleId: string,
    criteriaId: string,
  ): Promise<ApiResponse<RatingItem[]>> => {
    const value = Number(rating);
    if (!Number.isFinite(value)) {
      return { data: null, error: new Error('Rating is not a number') };
    }
    if (!userId || !moduleId || !criteriaId) {
      return { data: null, error: new Error('Missing ids') };
    }

    const { data, error } = await supabase
      .from('user_criteria_ratings')
      .upsert(
        [
          {
            user_id: userId,
            rating: value,
            module_id: moduleId,
            criteria_id: criteriaId,
          },
        ] as any,
        { onConflict: 'user_id,module_id,criteria_id' },
      )
      .select();

    return { data: data as RatingItem[], error };
  },

  /**
   * Fetch all ratings for a user
   */
  fetchAllRatings: async (userId: string): Promise<ApiResponse<RatingItem[]>> => {
    const { data, error } = await supabase
      .from('user_criteria_ratings')
      .select('id, user_id, module_id, criteria_id, rating')
      .eq('user_id', userId);

    return { data: (data as RatingItem[]) || [], error };
  },

  /**
   * Fetch criteria by keys
   */
  fetchCriteriaByKeys: async (
    keys: string[],
  ): Promise<ApiResponse<Array<{ key: string; name: string }>>> => {
    const { data, error } = await supabase.from('criteria').select('key, name').in('key', keys);

    return { data: data || [], error };
  },

  /**
   * Get average user rating for a module
   */
  getAverageUserRating: async (
    userId: string,
    moduleId: string,
  ): Promise<ApiResponse<{ rating: number } | null>> => {
    const { data, error } = await ratingsApi.fetchRatings(userId, moduleId);

    if (error) {
      return { data: null, error };
    }

    if (!data || data.length === 0) {
      return { data: null, error: null };
    }

    const sum = data.reduce((acc, item) => acc + (item.rating ?? 0), 0);
    const avg = sum / data.length;

    return {
      data: { rating: avg },
      error: null,
    };
  },

  /**
   * Get user skills summary for a module
   */
  getUserSkillsSummary: async (
    userId: string,
    moduleId: string,
  ): Promise<ApiResponse<SkillSummaryItem[]>> => {
    const { data: ratings, error: ratingsError } = await ratingsApi.fetchRatings(userId, moduleId);

    if (ratingsError) {
      return { data: null, error: ratingsError };
    }

    if (!ratings || ratings.length === 0) {
      return { data: [], error: null };
    }

    const keys = Array.from(new Set(ratings.map((r) => r.criteria_id).filter(Boolean)));

    const { data: criteria, error: criteriaError } = await ratingsApi.fetchCriteriaByKeys(keys);

    if (criteriaError) {
      return { data: null, error: criteriaError };
    }

    const nameByKey = new Map<string, string>();
    (criteria ?? []).forEach((c) => {
      nameByKey.set(c.key, c.name);
    });

    // Group ratings by criteria key
    const grouped: Record<string, { sum: number; count: number }> = {};

    ratings.forEach((item) => {
      if (!item.criteria_id) return;
      if (!grouped[item.criteria_id]) {
        grouped[item.criteria_id] = { sum: 0, count: 0 };
      }
      grouped[item.criteria_id].sum += item.rating ?? 0;
      grouped[item.criteria_id].count += 1;
    });

    const summary = Object.entries(grouped).map(([key, { sum, count }]) => ({
      criterion_id: key,
      criterion_name: nameByKey.get(key) ?? key,
      average_score: count > 0 ? sum / count : 0,
    }));

    return { data: summary, error: null };
  },
};
