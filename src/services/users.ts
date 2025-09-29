import type { User, UserUpdateData } from '@/src/constants/types/user';
import { getCurrentUser } from '@/src/utils/authUtils';
import { supabase } from '../config/supabaseClient';

/**
 * Получает данные пользователя по ID
 */
export const getUserById = async (userId: string): Promise<{ data: User | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  } catch (err) {
    console.error('Error fetching user by id:', err);
    return { data: null, error: err };
  }
};

/**
 * Получает данные текущего авторизованного пользователя
 */
export const getCurrentUserProfile = async (): Promise<{ data: User | null; error: any }> => {
  try {
    const authUser = await getCurrentUser();
    
    if (!authUser) {
      return { data: null, error: 'Користувач не автентифікований' };
    }
    
    return await getUserById(authUser.id);
  } catch (err) {
    console.error('Error fetching current user profile:', err);
    return { data: null, error: err };
  }
};

/**
 * Обновляет данные пользователя
 */
export const updateUserProfile = async (
  userId: string, 
  updateData: UserUpdateData
): Promise<{ data: User | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  } catch (err) {
    console.error('Error updating user profile:', err);
    return { data: null, error: err };
  }
};

/**
 * Обновляет данные текущего пользователя
 */
export const updateCurrentUserProfile = async (
  updateData: UserUpdateData
): Promise<{ data: User | null; error: any }> => {
  try {
    const authUser = await getCurrentUser();
    
    if (!authUser) {
      return { data: null, error: 'Користувач не автентифікований' };
    }
    
    return await updateUserProfile(authUser.id, updateData);
  } catch (err) {
    console.error('Error updating current user profile:', err);
    return { data: null, error: err };
  }
};

/**
 * Создает или обновляет профиль пользователя (upsert)
 */
export const upsertUserProfile = async (
  userId: string,
  userData: Partial<User>
): Promise<{ data: User | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          id: userId,
          ...userData,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();
    
    return { data, error };
  } catch (err) {
    console.error('Error upserting user profile:', err);
    return { data: null, error: err };
  }
};