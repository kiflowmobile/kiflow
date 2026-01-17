import { create } from 'zustand';
import { analytics } from '@/src/shared/lib/firebase';
import {
  logEvent as gaLogEvent,
  setUserId as gaSetUserId,
  setUserProperties as gaSetUserProperties,
} from 'firebase/analytics';
import {
  amplitude,
  initAmplitude as _initAmplitude,
  createIdentify,
} from '@/src/shared/lib/amplitude';

// Re-export for backwards compatibility
export const initAmplitude = _initAmplitude;

interface AnalyticsState {
  trackEvent: (eventName: string, params?: Record<string, any>) => void;
  onCompanySelect: (companyCode: string) => void;
  setUserId: (userId: string) => void;
}

export const useAnalyticsStore = create<AnalyticsState>(() => ({
  trackEvent: (eventName, params: Record<string, any> = {}) => {
    // Google Analytics
    if (analytics) {
      gaLogEvent(analytics, eventName, params);
    }

    // Amplitude
    amplitude.track(eventName, params);
  },

  onCompanySelect: (companyCode) => {
    if (!companyCode) return;

    // GA
    if (analytics)
      gaSetUserProperties(analytics, { company: companyCode.toLowerCase() });

    // Amplitude
    const identify = createIdentify();
    identify.set('company', companyCode.toLowerCase());
    amplitude.identify(identify);
  },

  setUserId: (userId) => {
    if (!userId) return;

    // GA
    if (analytics) gaSetUserId(analytics, userId);

    // Amplitude
    amplitude.setUserId(userId);
  },
}));
