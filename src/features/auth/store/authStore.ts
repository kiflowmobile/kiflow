import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import { authApi } from '../api/authApi';
import { isGuestSession } from '../utils/authUtils';
import type { AuthStore } from '../types';
import { asyncStorageUtils } from '@/src/shared/hooks/useAsyncStorage';

// Lazy imports to avoid circular dependencies
const getProgressStore = () => import('@/features/progress').then((m) => m.useUserProgressStore);
const getQuizStore = () => import('@/features/quiz').then((m) => m.useQuizStore);
const getAnalyticsService = () => import('@/features/analytics').then((m) => m.analyticsService);

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isGuest: null,
  error: null,
  justSignedUp: false,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await authApi.signIn({ email, password });
      if (error) throw error;

      const isGuest = isGuestSession(data?.session ?? null);
      set({
        user: data?.user ?? null,
        session: data?.session ?? null,
        isGuest,
        isLoading: false,
      });

      const currentUser = get().user;
      if (currentUser) {
        const analyticsService = await getAnalyticsService();
        analyticsService.setUserId(currentUser.id);
        analyticsService.trackEvent('start_screen__sign_in__click');
      }

      // Sync data from DB to local storage
      const [quizStore, progressStore] = await Promise.all([getQuizStore(), getProgressStore()]);
      await Promise.all(
        [
          quizStore.getState().syncQuizFromDBToLocalStorage?.(),
          progressStore.getState().syncProgressFromDBToLocalStorage?.(),
        ].filter(Boolean),
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  signUp: async (email: string, password: string, firstName?: string, lastName?: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await authApi.signUp({ email, password, firstName, lastName });
      if (error) throw error;
      if (!data?.user) throw new Error('User not created');

      // Create user profile
      await authApi.upsertUserProfile(data.user.id, {
        email: data.user.email || email,
        first_name: firstName || null,
        last_name: lastName || null,
      });

      const isGuest = isGuestSession(data.session);
      set({
        user: data.user,
        session: data.session,
        isGuest,
        isLoading: false,
        justSignedUp: true,
      });

      const currentUser = get().user;
      if (currentUser) {
        const analyticsService = await getAnalyticsService();
        analyticsService.setUserId(currentUser.id);
        analyticsService.trackEvent('start_screen__sign_up__click');
      }

      await AsyncStorage.setItem('justSignedUp', 'true');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data: session } = await authApi.getSession();
      if (!session) {
        set({
          user: null,
          session: null,
          isGuest: true,
          isLoading: false,
        });
        return;
      }

      // Sync local data to DB before signing out
      const [progressStore, quizStore] = await Promise.all([getProgressStore(), getQuizStore()]);
      await Promise.all(
        [
          progressStore.getState().syncProgressToDB?.(),
          quizStore.getState().syncQuizToDB?.(),
        ].filter(Boolean),
      );

      // Clear local user data
      await asyncStorageUtils.clearUserLocalData();

      const { error } = await authApi.signOut();
      if (error) throw error;

      set({
        user: null,
        session: null,
        isGuest: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      console.error('Error during signOut:', error);
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });

    try {
      const { error } = await authApi.signInWithGoogle();
      if (error) throw error;

      // Poll for session after OAuth redirect
      const checkSession = async () => {
        const { data } = await authApi.getSession();
        return data;
      };

      let session = null;
      let attempts = 0;
      const maxAttempts = 5;

      while (!session && attempts < maxAttempts) {
        session = await checkSession();
        if (!session) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;
        }
      }

      const isGuest = isGuestSession(session);
      set({
        user: session?.user || null,
        session,
        isGuest,
        isLoading: false,
      });
    } catch (error: unknown) {
      console.error('Error signing in with Google:', error);
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  checkSession: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data: session, error } = await authApi.getSession();
      if (error) throw error;

      const isGuest = isGuestSession(session);
      set({
        user: session?.user || null,
        session,
        isGuest,
        isLoading: false,
      });
    } catch (error: unknown) {
      console.error('AuthStore: Error getting session:', error);
      set({
        user: null,
        session: null,
        isGuest: true,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Session check failed',
      });
    }
  },

  getUserRole: async () => {
    try {
      const { data: user, error } = await authApi.getUser();
      if (error || !user) return null;
      return user.user_metadata?.role || 'user';
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: user, error: userError } = await authApi.getUser();
      if (userError || !user || !user.email) {
        throw new Error('User not authenticated');
      }

      // Verify current password
      const { error: signInError } = await authApi.signIn({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        throw new Error('Incorrect current password');
      }

      // Update password
      const { error: updateError } = await authApi.updatePassword(newPassword);
      if (updateError) throw updateError;

      set({ isLoading: false });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to change password';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  setJustSignedUp: (justSignedUp: boolean) => set({ justSignedUp }),
  clearError: () => set({ error: null }),
  setUser: (user: User | null) => set({ user }),
  setSession: (session: Session | null) => set({ session }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),
}));

// Subscribe to auth state changes
authApi.onAuthStateChange((event, session) => {
  const { setUser, setSession, setLoading } = useAuthStore.getState();

  if (session && session.user && !session.user.is_anonymous) {
    setUser(session.user);
    setSession(session);
    useAuthStore.setState({ isGuest: false });
  } else {
    setUser(null);
    setSession(null);
    useAuthStore.setState({ isGuest: true });
  }

  setLoading(false);
});
