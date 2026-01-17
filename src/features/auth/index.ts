// Store
export { useAuthStore } from './store/authStore';

// Hooks
export { useAuth, useCurrentUser, useIsAuthenticated, useAuthLoading } from './hooks/useAuth';

// API
export { authApi } from './api/authApi';

// Utils
export {
  getCurrentUser,
  getCurrentUserId,
  emailRegex,
  normalizeEmail,
  mapAuthErrorToMessage,
  isGuestSession,
} from './utils/authUtils';

// Types
export type {
  AuthState,
  AuthActions,
  AuthStore,
  AuthError,
  SignUpParams,
  SignInParams,
  UserProfile,
  Session,
  User,
} from './types';

// Screens
export { LoginScreen } from './components/login-screen';
