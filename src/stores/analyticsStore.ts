import { create } from 'zustand';
import { analytics } from '../firebase'; // <-- ось твій об’єкт
import { logEvent as gaLogEvent, setUserId as gaSetUserId, setUserProperties as gaSetUserProperties } from 'firebase/analytics';
import * as amplitude from '@amplitude/analytics-browser';

const AMPLITUDE_API_KEY = '64fd3a584ae35077dd93bea63cd25c3e';

export const initAmplitude = () => {
  amplitude.init(AMPLITUDE_API_KEY, {
    defaultTracking: {
      sessions: true,
      pageViews: true,
    },
  });
};

interface AnalyticsState {
  trackEvent: (eventName: string, params?: Record<string, any>) => void;
  onCompanySelect: (companyCode: string) => void;
  setUserId: (userId: string) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
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
    if (analytics) gaSetUserProperties(analytics, { company: companyCode.toLowerCase() });
  
    // Amplitude
    const identify = new amplitude.Identify();
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
