// Re-export from new location for backwards compatibility
// TODO: Update imports to use @/src/features/profile directly
import { profileApi } from '@/src/features/profile';

// Legacy function exports for backwards compatibility
export const getUserById = profileApi.getUserById;
export const getCurrentUserProfile = profileApi.getCurrentUserProfile;
export const updateUserProfile = profileApi.updateUserProfile;
export const updateCurrentUserProfile = profileApi.updateCurrentUserProfile;
export const upsertUserProfile = profileApi.upsertUserProfile;
export const getCurrentUserCode = profileApi.getCurrentUserCode;

