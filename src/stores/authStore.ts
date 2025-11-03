import { supabase } from '@/src/config/supabaseClient';
import { upsertUserProfile } from '@/src/services/users';
import { Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { useUserProgressStore } from './userProgressStore';
import { useQuizStore } from './quizStore';
import { useChatStore } from './chatStore';
import { clearUserLocalData } from '../utils/asyncStorege';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAnalyticsStore } from './analyticsStore';

const analyticsStore = useAnalyticsStore.getState();


 export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isGuest: boolean | null;
  error: string | null;
  justSignedUp: boolean
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
  getUserRole: () => Promise<string | null>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;

  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  (set, get) => ({
    user: null,
    session: null,
    isLoading: true,
    isGuest: null,
    error: null,
    justSignedUp: false,

    signIn: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const isGuest = !data.session || !data.session.user || data.session.user.is_anonymous;
        set({
          user: data.user,
          session: data.session,
          isGuest,
          isLoading: false,
        });

        const currentUser = get().user;
        if (currentUser) {
          analyticsStore.setUserId(currentUser.id);
          analyticsStore.trackEvent('start_screen__sign_in__click');
        }

        await useQuizStore.getState().syncQuizFromDBToLocalStorage();
        await useChatStore.getState().syncChatFromDBToLocalStorage();

      } catch (error: any) {
        set({
          error: error.message || 'Sign in failed',
          isLoading: false,
        });
        throw error;
      }
    },

    signUp: async (email: string, password: string, firstName?: string, lastName?: string) => {
      set({ isLoading: true, error: null });

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

        if (error) throw error;

        if (!data.user) throw new Error('User not created');

        await upsertUserProfile(data.user.id, {
          email: data.user.email || email,
          full_name: firstName && lastName ? `${firstName} ${lastName}` : null,
          first_name: firstName || undefined,
          last_name: lastName || undefined,
        });

        const isGuest = !data.session || !data.session.user || data.session.user.is_anonymous;
        set({
          user: data.user,
          session: data.session,
          isGuest,
          isLoading: false,
          justSignedUp: true,
        });

        const currentUser = get().user;
        if (currentUser) {
          analyticsStore.setUserId(currentUser.id);
          analyticsStore.trackEvent('start_screen__sign_up__click');
        }

        await AsyncStorage.setItem('justSignedUp', 'true');

      } catch (error: any) {
        set({
          error: error.message || 'Sign up failed',
          isLoading: false,
        });
        throw error;
      }
    },

    signOut: async () => {
      set({ isLoading: true, error: null });
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          set({
            user: null,
            session: null,
            isGuest: true,
            isLoading: false
          });
          return;
        }
        await useUserProgressStore.getState().syncProgressToDB();
        await useQuizStore.getState().syncQuizToDB();
        await useChatStore.getState().syncChatFromLocalStorageToDB();

        await clearUserLocalData();
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        set({
          user: null,
          session: null,
          isGuest: true,
          isLoading: false
        });
      } catch (error: any) {
        console.error('Error during signOut:', error);
        set({
          error: error.message || 'Sign out failed',
          isLoading: false,
        });
        throw error;
      }
    },

    signInWithGoogle: async () => {
      set({ isLoading: true, error: null });
      try {
        await supabase.auth.signOut();
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
        });

        if (error) throw error;
        const checkSession = async () => {
          const { data: sessionData } = await supabase.auth.getSession();
          return sessionData?.session;
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

        const isGuest = !session || !session.user || session.user.is_anonymous;
        set({
          user: session?.user || null,
          session,
          isGuest,
          isLoading: false,
        });
      } catch (error: any) {
        console.error('Error signing in with Google:', error);
        set({
          error: error.message || 'Google sign in failed',
          isLoading: false,
        });
        throw error;
      }
    },

    checkSession: async () => {
      set({ isLoading: true, error: null });
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const isGuest = !data.session || !data.session.user || data.session.user.is_anonymous;

        set({
          user: data.session?.user || null,
          session: data.session,
          isGuest,
          isLoading: false,
        });
      } catch (error: any) {
        console.error('❌ AuthStore: Error getting session:', error);
        set({
          user: null,
          session: null,
          isGuest: true,
          isLoading: false,
          error: error.message || 'Session check failed',
        });
      }
    },

    getUserRole: async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
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
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user || !user.email) {
          throw new Error('Користувач не автентифікований');
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (signInError) {
          throw new Error('Неправильний поточний пароль');
        }
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) throw updateError;

        set({ isLoading: false });
      } catch (error: any) {
        set({
          error: error.message || 'Не вдалося змінити пароль',
          isLoading: false,
        });
        throw error;
      }
    },

    clearError: () => set({ error: null }),

    setUser: (user: User | null) => set({ user }),
    setSession: (session: Session | null) => set({ session }),
    setLoading: (loading: boolean) => set({ isLoading: loading }),
    setError: (error: string | null) => set({ error }),
  }),

);

supabase.auth.onAuthStateChange((event, session) => {
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
