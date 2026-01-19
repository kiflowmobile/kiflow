import {
  logEvent,
  setUserId as setFirebaseUserId,
  setUserProperties as setFirebaseUserProperties,
} from 'firebase/analytics';
import { getFirebaseAnalytics } from '@/shared/lib/firebase/firebase';
import {
  initAmplitude,
  logAmplitudeEvent,
  setAmplitudeUserId,
  setAmplitudeUserProperties,
} from '@/shared/lib/amplitude/analytics';

class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {
    this.init();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private init() {
    // Initialize Amplitude
    initAmplitude();
    // Firebase auto-inits on import usually, but we check access
    getFirebaseAnalytics();
  }

  /**
   * Track an event to all analytics providers
   */
  public trackEvent(eventName: string, properties?: Record<string, any>) {
    try {
      // Track Amplitude
      logAmplitudeEvent(eventName, properties);

      // Track Firebase
      const firebaseAnalytics = getFirebaseAnalytics();
      if (firebaseAnalytics) {
        logEvent(firebaseAnalytics, eventName, properties);
      }
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  /**
   * Set User ID for all providers
   */
  public setUserId(userId: string) {
    try {
      setAmplitudeUserId(userId);

      const firebaseAnalytics = getFirebaseAnalytics();
      if (firebaseAnalytics) {
        setFirebaseUserId(firebaseAnalytics, userId);
      }
    } catch (error) {
      console.warn('Analytics setUserId failed:', error);
    }
  }

  /**
   * Set User Properties
   */
  public setUserProperties(properties: Record<string, any>) {
    try {
      setAmplitudeUserProperties(properties);

      const firebaseAnalytics = getFirebaseAnalytics();
      if (firebaseAnalytics) {
        setFirebaseUserProperties(firebaseAnalytics, properties);
      }
    } catch (error) {
      console.warn('Analytics setUserProperties failed:', error);
    }
  }
}

export const analytics = AnalyticsService.getInstance();
