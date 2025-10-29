// analyticsStore.ts
import { create } from 'zustand';
import { analytics } from '../firebase';
import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';

interface AnalyticsState {
  trackEvent: (eventName: string, params?: Record<string, any>) => void;
  onCompanySelect: (companyCode: string) => void;
  setUserId: (userId: string) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  // Загальна функція для логування подій
  trackEvent: (eventName: string, params: Record<string, any> = {}) => {
    if (!analytics) return;
    logEvent(analytics, eventName, params);
    console.log('GA event:', eventName, params); // debug
  },
  // Встановлюємо company як user property
  onCompanySelect: (companyCode) => {
    if (!analytics || !companyCode) return;
    setUserProperties(analytics, { company: companyCode.toLowerCase() });
  },

  // Встановлюємо user id
  setUserId: (userId) => {
    if (!analytics || !userId) return;
    try {
      analytics && setUserId(analytics, userId);
    } catch (err) {
      console.error('Error setting userId:', err);
    }
  },
}));
