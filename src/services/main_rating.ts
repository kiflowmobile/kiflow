import { supabase } from '../config/supabaseClient';



export interface SkillSummaryItem {
  criterion_id: string;
  criterion_name: string;
  average_score: number;
}


export const saveUserRating = async (
  userId: string,
  rating: string | number,
  moduleId?: string,
  key?: string
): Promise<{ data: any; error: any }> => {
  try {
    if (!userId || rating == null || !key) {
      throw new Error('Не передані обовʼязкові параметри для збереження оцінки');
    }

    const normalizedRating =
      typeof rating === 'string' ? parseInt(rating, 10) : rating;

    const { data: existing, error: fetchError } = await supabase
      .from('main_rating')
      .select('rating')
      .eq('user_id', userId)
      .eq('criteria_key', key)
      .eq('module_id', moduleId ?? null)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Помилка при пошуку існуючої оцінки:', fetchError.message);
      return { data: null, error: fetchError };
    }

    let finalRating = normalizedRating;

    if (existing) {
      finalRating = (existing.rating + normalizedRating) / 2;
    }

    const { data, error } = await supabase
      .from('main_rating')
      .upsert(
        [
          {
            user_id: userId,
            rating: finalRating,
            module_id: moduleId,
            criteria_key: key
          }
        ],
        { onConflict: 'module_id, user_id, criteria_key' }
      )
      .select();

    if (error) {
      console.error('❌ Помилка при збереженні оцінки в Supabase:', error.message);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err: any) {
    console.error('❌ Виняток при збереженні оцінки:', err.message);
    return { data: null, error: err };
  }
};

export const getAverageUserRating = async (
  userId: string,
  moduleId: string
): Promise<{ data: { rating: number | null }; error: any }> => {
  try {
    if (!userId || !moduleId) {
      throw new Error('Не передані обовʼязкові параметри');
    }

    const { data, error } = await supabase
      .from('main_rating')
      .select('rating')
      .eq('user_id', userId)
      .eq('module_id', moduleId);

    if (error) {
      console.error('❌ Помилка при отриманні оцінок:', error.message);
      return { data: { rating: null }, error };
    }

    if (!data || data.length === 0) {
      return { data: { rating: null }, error: null };
    }

    const total = data.reduce((sum, item) => sum + (item.rating || 0), 0);
    const average = total / data.length;

    return { data: { rating: average }, error: null };
  } catch (err: any) {
    console.error('❌ Виняток при розрахунку середнього:', err.message);
    return { data: { rating: null }, error: err };
  }
};

export const getUserSkillsSummary = async (
  userId: string,
  moduleId: string
): Promise<{ data: SkillSummaryItem[]; error: any }> => {
  try {
    if (!userId || !moduleId) {
      throw new Error('Не передані обовʼязкові параметри');
    }

    const { data: ratings, error: ratingsError } = await supabase
      .from('main_rating')
      .select('criteria_key, rating')
      .eq('user_id', userId)
      .eq('module_id', moduleId);

    if (ratingsError) {
      console.error('❌ Помилка при отриманні рейтингів:', ratingsError.message);
      return { data: [], error: ratingsError };
    }

    if (!ratings || ratings.length === 0) {
      return { data: [], error: null };
    }

    const criteriaKeys = ratings.map((r: any) => r.criteria_key);
    const { data: criteriaData, error: criteriaError } = await supabase
      .from('criterias')
      .select('key, name')
      .in('key', criteriaKeys);

    if (criteriaError) {
      console.error('❌ Помилка при отриманні назв критеріїв:', criteriaError.message);
      return { data: [], error: criteriaError };
    }

    const skills: SkillSummaryItem[] = ratings.map((r: any) => {
      const criterion = criteriaData?.find((c: any) => c.key === r.criteria_key);
      return {
        criterion_id: r.criteria_key,
        criterion_name: criterion?.name || r.criteria_key,
        average_score: r.rating || 0,
      };
    });

    return { data: skills, error: null };
  } catch (err: any) {
    console.error('❌ Виняток при формуванні характеристик:', err.message);
    return { data: [], error: err };
  }
};