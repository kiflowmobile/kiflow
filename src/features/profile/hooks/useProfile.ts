import { useState, useCallback } from 'react';
import { profileApi } from '../api/profileApi';
import type { User, UserUpdateData } from '../types';

/**
 * Hook to manage user profile operations
 */
export function useProfile() {
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: apiError } = await profileApi.getCurrentUserProfile();
      if (apiError) throw apiError;
      setProfile(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch profile';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updateData: UserUpdateData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: apiError } =
        await profileApi.updateCurrentUserProfile(updateData);
      if (apiError) throw apiError;
      setProfile(data);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    clearError,
  };
}
