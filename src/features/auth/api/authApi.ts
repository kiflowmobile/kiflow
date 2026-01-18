import { supabase } from '@/src/shared/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { SignInParams, SignUpParams, UserProfile } from '../types';

export interface AuthApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export const authApi = {
  async signIn({
    email,
    password,
  }: SignInParams): Promise<AuthApiResponse<{ user: User | null; session: Session | null }>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: { user: data.user, session: data.session }, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Sign in failed'),
      };
    }
  },

  async signUp({
    email,
    password,
    firstName,
    lastName,
  }: SignUpParams): Promise<AuthApiResponse<{ user: User | null; session: Session | null }>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: firstName && lastName ? `${firstName} ${lastName}` : null,
            first_name: firstName || null,
            last_name: lastName || null,
            role: 'user',
          },
        },
      });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: { user: data.user, session: data.session }, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Sign up failed'),
      };
    }
  },

  async signOut(): Promise<AuthApiResponse<void>> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      return { data: undefined, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Sign out failed'),
      };
    }
  },

  async signInWithGoogle(): Promise<AuthApiResponse<void>> {
    try {
      await supabase.auth.signOut();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: undefined, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Google sign in failed'),
      };
    }
  },

  async getSession(): Promise<AuthApiResponse<Session | null>> {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      return { data: data.session, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to get session'),
      };
    }
  },

  async getUser(): Promise<AuthApiResponse<User | null>> {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      return { data: data.user, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to get user'),
      };
    }
  },

  async updatePassword(newPassword: string): Promise<AuthApiResponse<void>> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      return { data: undefined, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to update password'),
      };
    }
  },

  async upsertUserProfile(
    userId: string,
    profile: Partial<Omit<UserProfile, 'id'>>,
  ): Promise<AuthApiResponse<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: userId,
          ...profile,
        } as any)
        .select()
        .single();

      if (error) {
        return { data: null, error: new Error(error.message) };
      }

      return { data: data as UserProfile, error: null };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Failed to upsert user profile'),
      };
    }
  },

  // Subscribe to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void): {
    unsubscribe: () => void;
  } {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return { unsubscribe: () => data.subscription.unsubscribe() };
  },
};
