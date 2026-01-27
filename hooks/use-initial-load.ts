import { useCallback, useRef, useState } from "react";

/**
 * Hook to manage loading state that only shows on initial load.
 * Prevents loading flicker when data is refetched (e.g., after returning from background).
 *
 * @param key - A unique key to identify what data is being loaded.
 *              When the key changes, it's treated as a new initial load.
 */
export function useInitialLoad(key: string) {
  const [loading, setLoading] = useState(true);
  const loadedKeyRef = useRef<string | null>(null);

  const startLoading = useCallback(() => {
    // Only show loading state if this is a new key (initial load)
    if (loadedKeyRef.current !== key) {
      setLoading(true);
    }
  }, [key]);

  const finishLoading = useCallback(() => {
    // Only update loading state if this was an initial load
    if (loadedKeyRef.current !== key) {
      setLoading(false);
      loadedKeyRef.current = key;
    }
  }, [key]);

  const isInitialLoad = loadedKeyRef.current !== key;

  return {
    loading,
    isInitialLoad,
    startLoading,
    finishLoading,
  };
}
