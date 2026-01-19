import { useAuthStore } from '../store/authStore';

/**
 * Hook to access auth state and actions
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isGuest = useAuthStore((state) => state.isGuest);
  const error = useAuthStore((state) => state.error);
  const justSignedUp = useAuthStore((state) => state.justSignedUp);
  const setJustSignedUp = useAuthStore((state) => state.setJustSignedUp);

  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);
  const signOut = useAuthStore((state) => state.signOut);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const checkSession = useAuthStore((state) => state.checkSession);
  const clearError = useAuthStore((state) => state.clearError);
  const getUserRole = useAuthStore((state) => state.getUserRole);
  const changePassword = useAuthStore((state) => state.changePassword);

  const isAuthenticated = !!user && !isGuest;

  return {
    // State
    user,
    session,
    isLoading,
    isGuest,
    isAuthenticated,
    error,
    justSignedUp,

    // Actions
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    checkSession,
    clearError,
    getUserRole,
    changePassword,
    setJustSignedUp,
  };
}

/**
 * Hook to get just the current user
 */
export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}

/**
 * Hook to check if user is authenticated (not guest)
 */
export function useIsAuthenticated() {
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  return !!user && !isGuest;
}

/**
 * Hook to get auth loading state
 */
export function useAuthLoading() {
  return useAuthStore((state) => state.isLoading);
}
