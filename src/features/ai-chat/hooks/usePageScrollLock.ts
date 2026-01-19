import { useRef, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';

export function usePageScrollLock() {
  const pageScrollLockedRef = useRef(false);

  const lockPageScroll = useCallback(() => {
    if (Platform.OS !== 'web' || pageScrollLockedRef.current) return;
    const y = window.scrollY || 0;
    (document.body as any).dataset.lockScrollY = String(y);
    document.body.style.position = 'fixed';
    document.body.style.top = `-${y}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    pageScrollLockedRef.current = true;
  }, []);

  const unlockPageScroll = useCallback(() => {
    if (Platform.OS !== 'web' || !pageScrollLockedRef.current) return;
    const y = Number((document.body as any).dataset.lockScrollY || 0);
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    delete (document.body as any).dataset.lockScrollY;
    pageScrollLockedRef.current = false;
    window.scrollTo(0, y);
  }, []);

  useEffect(() => {
    return () => {
      unlockPageScroll();
    };
  }, [unlockPageScroll]);

  return { lockPageScroll, unlockPageScroll };
}
