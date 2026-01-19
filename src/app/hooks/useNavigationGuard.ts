import { useEffect } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';

interface UseNavigationGuardParams {
  isReady: boolean;
  isLoading: boolean;
  isGuest: boolean | null;
}

export function useNavigationGuard({ isReady, isLoading, isGuest }: UseNavigationGuardParams) {
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const isNavigationReady = Boolean(navigationState?.key);

  useEffect(() => {
    if (isReady && !isLoading && isGuest && isNavigationReady) {
      // Delay navigation to the next tick so the Root navigator has a chance to mount.
      // This avoids "Attempted to navigate before mounting the Root Layout component".
      const id = setTimeout(() => {
        router.replace('/');
      }, 0);
      return () => clearTimeout(id);
    }
  }, [isGuest, isLoading, isNavigationReady, isReady, router]);

  return { isNavigationReady };
}
