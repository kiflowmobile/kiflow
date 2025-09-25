import { supabase } from '@/src/config/supabaseClient';
import { User } from '@supabase/supabase-js';

/**
 * Utility function to get current user from Supabase
 * This is used in services where we can't use Zustand store directly
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Unexpected error getting current user:', error);
    return null;
  }
};

/**
 * Utility function to get current user ID
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  const user = await getCurrentUser();
  return user?.id || null;
};
