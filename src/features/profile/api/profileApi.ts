import { supabase, type ApiResponse } from '@/src/shared/lib/supabase';
import { getCurrentUser } from '@/src/features/auth';
import type { User, UserUpdateData } from '../types';

export const profileApi = {
  /**
   * Get user by ID
   */
  getUserById: async (userId: string): Promise<ApiResponse<User>> => {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();

      return { data, error };
    } catch (err) {
      console.error('Error fetching user by id:', err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Get current authenticated user's profile
   */
  getCurrentUserProfile: async (): Promise<ApiResponse<User>> => {
    try {
      const authUser = await getCurrentUser();

      if (!authUser) {
        return { data: null, error: new Error('User not authenticated') };
      }

      return await profileApi.getUserById(authUser.id);
    } catch (err) {
      console.error('Error fetching current user profile:', err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Update user profile
   */
  updateUserProfile: async (
    userId: string,
    updateData: UserUpdateData,
  ): Promise<ApiResponse<User>> => {
    try {
      const { data, error } = await supabase
        .from('users')
        // @ts-expect-error - Supabase type inference issue with update method
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.error('Error updating user profile:', err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Update current user's profile
   */
  updateCurrentUserProfile: async (updateData: UserUpdateData): Promise<ApiResponse<User>> => {
    try {
      const authUser = await getCurrentUser();

      if (!authUser) {
        return { data: null, error: new Error('User not authenticated') };
      }

      return await profileApi.updateUserProfile(authUser.id, updateData);
    } catch (err) {
      console.error('Error updating current user profile:', err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Create or update user profile (upsert)
   */
  upsertUserProfile: async (
    userId: string,
    userData: Partial<User>,
  ): Promise<ApiResponse<User>> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert(
          {
            id: userId,
            ...userData,
          } as any,
          { onConflict: 'id' },
        )
        .select()
        .single();

      return { data, error };
    } catch (err) {
      console.error('Error upserting user profile:', err);
      return { data: null, error: err as Error };
    }
  },

  /**
   * Get the current user's company code
   */
  getCurrentUserCode: async (): Promise<{ code: string | null; error: Error | null }> => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        return { code: null, error: new Error('User not authenticated') };
      }

      const { data, error } = await supabase
        .from('company_members')
        .select(
          `
          company_id,
          joined_via_code,
          companies (code)
        `,
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { code: null, error };
      }

      const code = (data as any)?.joined_via_code || (data as any)?.companies?.code || null;
      return { code, error: null };
    } catch (err) {
      console.error('Error fetching user company code:', err);
      return { code: null, error: err as Error };
    }
  },
};
