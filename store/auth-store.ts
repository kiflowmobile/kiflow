import { getUserEnrollments, redeemInviteCode } from "@/lib/database";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { User } from "@supabase/supabase-js";
import { create } from "zustand";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  hasEnrollments: boolean;
  initialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  redeemInviteCode: (code: string) => Promise<{ success: boolean; error?: string }>;
  checkHasEnrollments: () => Promise<void>;
  updateUser: (user: User | null, session: Session | null) => void;
  updateProfile: (firstName: string, lastName: string, email: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  hasEnrollments: false,
  initialized: false,

  initialize: async () => {
    try {
      set({ loading: true });

      // Get current session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (session?.user) {
        set({ user: session.user, session });
        await get().checkHasEnrollments();
      }

      set({ initialized: true, loading: false });

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          set({ user: session.user, session });
          await get().checkHasEnrollments();
        } else if (event === "SIGNED_OUT") {
          set({ user: null, session: null, hasEnrollments: false });
        }
      });
    } catch (error: any) {
      console.error("Auth initialization error:", error);
      set({ loading: false, initialized: true });
    }
  },

  signUp: async (email, password, firstName, lastName) => {
    try {
      set({ loading: true });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName,
            lastName,
          },
          emailRedirectTo: undefined, // We'll handle email verification in-app
        },
      });

      if (error) {
        set({ loading: false });
        return { success: false, error: error.message };
      }

      if (data.user) {
        set({ user: data.user, session: data.session, loading: false });
      }

      return { success: true };
    } catch (error: any) {
      set({ loading: false });
      return { success: false, error: error.message };
    }
  },

  signIn: async (email, password) => {
    try {
      set({ loading: true });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ loading: false });
        return { success: false, error: error.message };
      }

      if (data.user && data.session) {
        set({ user: data.user, session: data.session });
        await get().checkHasEnrollments();
        set({ loading: false });
      }

      return { success: true };
    } catch (error: any) {
      set({ loading: false });
      return { success: false, error: error.message };
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      await supabase.auth.signOut();
      set({ user: null, session: null, hasEnrollments: false, loading: false });
    } catch (error: any) {
      console.error("Sign out error:", error);
      set({ loading: false });
    }
  },

  resetPassword: async (email) => {
    try {
      set({ loading: true });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: undefined, // We'll handle this in-app
      });

      if (error) {
        set({ loading: false });
        return { success: false, error: error.message };
      }

      set({ loading: false });
      return { success: true };
    } catch (error: any) {
      set({ loading: false });
      return { success: false, error: error.message };
    }
  },

  redeemInviteCode: async (code) => {
    try {
      set({ loading: true });

      const user = get().user;
      if (!user) {
        set({ loading: false });
        return { success: false, error: "Користувач не авторизований" };
      }

      const result = await redeemInviteCode(code);
      if (!result.success) {
        set({ loading: false });
        return result;
      }

      // Refresh enrollments after successful redemption
      await get().checkHasEnrollments();
      set({ loading: false });
      return { success: true };
    } catch (error: any) {
      set({ loading: false });
      return { success: false, error: error.message };
    }
  },

  checkHasEnrollments: async () => {
    try {
      const user = get().user;
      if (!user) {
        set({ hasEnrollments: false });
        return;
      }

      const enrollments = await getUserEnrollments(user.id);
      set({ hasEnrollments: enrollments.length > 0 });
    } catch (error) {
      console.error("Error checking enrollments:", error);
      set({ hasEnrollments: false });
    }
  },

  updateUser: (user, session) => {
    set({ user, session });
  },

  updateProfile: async (firstName, lastName, email) => {
    try {
      set({ loading: true });

      const user = get().user;
      if (!user) {
        set({ loading: false });
        return { success: false, error: "Користувач не авторизований" };
      }

      // Update user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          firstName,
          lastName,
        },
      });

      if (metadataError) {
        set({ loading: false });
        return { success: false, error: metadataError.message };
      }

      // Update email if changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email,
        });

        if (emailError) {
          set({ loading: false });
          return { success: false, error: emailError.message };
        }
      }

      // Refresh user data
      const {
        data: { user: updatedUser },
      } = await supabase.auth.getUser();
      const {
        data: { session: updatedSession },
      } = await supabase.auth.getSession();
      set({ user: updatedUser ?? null, session: updatedSession ?? null, loading: false });

      return { success: true };
    } catch (error: any) {
      set({ loading: false });
      return { success: false, error: error.message };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      set({ loading: true });

      const user = get().user;
      if (!user || !user.email) {
        set({ loading: false });
        return { success: false, error: "Користувач не авторизований" };
      }

      // Verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        set({ loading: false });
        return { success: false, error: "Невірний поточний пароль" };
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        set({ loading: false });
        return { success: false, error: updateError.message };
      }

      set({ loading: false });
      return { success: true };
    } catch (error: any) {
      set({ loading: false });
      return { success: false, error: error.message };
    }
  },
}));
