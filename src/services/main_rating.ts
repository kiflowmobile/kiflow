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
export const fetchRating = async (userId: string, moduleId: string, key: string) => {
  return await supabase
    .from('main_rating')
    .select('rating')
    .eq('user_id', userId)
    .eq('criteria_key', key)
    .eq('module_id', moduleId ?? null)
    .single();
};

// вставка / апдейт
export const upsertRating = async (userId: string, rating: number, moduleId: string, key: string) => {
  return await supabase
    .from('main_rating')
    .upsert([{ user_id: userId, rating, module_id: moduleId, criteria_key: key }], {
      onConflict: 'module_id, user_id, criteria_key',
    })
    .select();
};

// всі оцінки користувача без обмеження по модулю
export const fetchAllRatings = async (userId: string) => {
  return await supabase
    .from('main_rating')
    .select('rating')
    .eq('user_id', userId);
};

// таблиця критеріїв
export const fetchCriteriasByKeys = async (keys: string[]) => {
  return await supabase.from('criterias').select('key, name').in('key', keys);
};
