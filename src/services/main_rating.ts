import { supabase } from '../config/supabaseClient';

// таблиця оцінок
export const fetchRatings = async (userId: string, moduleId: string) => {
  return await supabase
    .from('main_rating')
    .select('criteria_key, rating')
    .eq('user_id', userId)
    .eq('module_id', moduleId);
};

// конкретна оцінка
export const fetchRating = async (userId: string, moduleId: string, key: string, lessonId: string) => {
  return await supabase
    .from('main_rating')
    .select('rating')
    .eq('user_id', userId)
    .eq('criteria_key', key)
    .eq('module_id', moduleId ?? null)
    .eq('lesson_id', lessonId)
    .single();
};

// вставка / апдейт
export const upsertRating = async (
  userId: string,
  rating: number,
  moduleId: string,
  key: string,
  courseId: string,
  lessonId: string
) => {
  const value = Number(rating);
  if (!Number.isFinite(value)) throw new Error('Rating is not a number');
  if (!userId || !moduleId || !key || !courseId || !lessonId) throw new Error('Missing ids');

  const { data, error } = await supabase
    .from('main_rating')
    .upsert(
      [
        {
          user_id: userId,
          rating: value,
          module_id: moduleId,
          criteria_key: key,
          course_id: courseId,
          lesson_id: lessonId,
        },
      ],
      { onConflict: 'user_id,module_id,criteria_key,course_id, lesson_id' },
    )
    .select();

  if (error) throw error;
  return data;
};

// всі оцінки користувача без обмеження по модулю
export const fetchAllRatings = async (userId: string) => {
  return await supabase
    .from('main_rating')
    .select('id, user_id, module_id, criteria_key, rating')
    .eq('user_id', userId);
};

// таблиця критеріїв
export const fetchCriteriasByKeys = async (keys: string[]) => {
  return await supabase.from('criterias').select('key, name').in('key', keys);
};

/**
 * Середній бал користувача за конкретний модуль
 * Повертає { data: { rating: number } | null, error }
 */
export const getAverageUserRating = async (userId: string, moduleId: string) => {
  const { data, error } = await fetchRatings(userId, moduleId);

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
};

/**
 * Зріз навичок за модулем:
 * повертає масив { criterion_key, criterion_name, average_score }
 * щоб далі можна було мапити в лист навичок у листі/дашборді
 */
export const getUserSkillsSummary = async (userId: string, moduleId: string) => {
  const { data: ratings, error: ratingsError } = await fetchRatings(userId, moduleId);

  if (ratingsError) {
    return { data: null, error: ratingsError };
  }

  if (!ratings || ratings.length === 0) {
    return { data: [], error: null };
  }

  const keys = Array.from(new Set(ratings.map((r) => r.criteria_key).filter(Boolean)));

  const { data: criterias, error: criteriasError } = await fetchCriteriasByKeys(keys);

  if (criteriasError) {
    return { data: null, error: criteriasError };
  }

  const nameByKey = new Map<string, string>();
  (criterias ?? []).forEach((c: any) => {
    nameByKey.set(c.key, c.name);
  });

  // групуємо оцінки по ключу критерію
  const grouped: Record<
    string,
    {
      sum: number;
      count: number;
    }
  > = {};

  ratings.forEach((item: any) => {
    if (!item.criteria_key) return;
    if (!grouped[item.criteria_key]) {
      grouped[item.criteria_key] = { sum: 0, count: 0 };
    }
    grouped[item.criteria_key].sum += item.rating ?? 0;
    grouped[item.criteria_key].count += 1;
  });

  const summary = Object.entries(grouped).map(([key, { sum, count }]) => ({
    criterion_key: key,
    criterion_name: nameByKey.get(key) ?? key,
    average_score: count > 0 ? sum / count : 0,
  }));

  return { data: summary, error: null };
};


export const deleteUsersCourseReting = async (userId: string, courseId: string) => {
  const {error } = await supabase
    .from('main_rating')
    .delete()
    .eq('user_id', userId)
    .eq('course_id', courseId);
  if (error) throw new Error(error.message);
}