import * as amplitude from '@amplitude/analytics-browser';

const AMPLITUDE_API_KEY = '64fd3a584ae35077dd93bea63cd25c3e';

let isInitialized = false;

/**
 * Check if we're in a browser environment
 */
const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

/**
 * Initialize Amplitude analytics (only in browser environment)
 */
export const initAmplitude = (): void => {
  if (!isBrowser()) {
    return;
  }

  if (isInitialized) return;

  try {
    amplitude.init(AMPLITUDE_API_KEY, {
      defaultTracking: {
        sessions: true,
        pageViews: true,
      },
    });

    isInitialized = true;
  } catch (error) {
    console.warn('Failed to initialize Amplitude:', error);
  }
};

/**
 * Log an event to Amplitude
 */
export const logAmplitudeEvent = (
  eventName: string,
  eventProps: Record<string, any> = {},
): void => {
  if (!isBrowser() || !isInitialized) {
    return;
  }

  try {
    amplitude.track(eventName, eventProps);
  } catch (error) {
    console.warn('Failed to track Amplitude event:', error);
  }
};

/**
 * Set the user ID in Amplitude
 */
export const setAmplitudeUserId = (userId: string): void => {
  if (!isBrowser() || !isInitialized || !userId) {
    return;
  }

  try {
    amplitude.setUserId(userId);
  } catch (error) {
    console.warn('Failed to set Amplitude user ID:', error);
  }
};

/**
 * Set user properties in Amplitude
 */
export const setAmplitudeUserProperties = (properties: Record<string, any>): void => {
  if (!isBrowser() || !isInitialized) {
    return;
  }

  try {
    const identify = new amplitude.Identify();
    Object.entries(properties).forEach(([key, value]) => {
      identify.set(key, value);
    });
    amplitude.identify(identify);
  } catch (error) {
    console.warn('Failed to set Amplitude user properties:', error);
  }
};

/**
 * Create an Identify instance for setting user properties
 */
export const createIdentify = (): amplitude.Identify | null => {
  if (!isBrowser() || !isInitialized) {
    return null;
  }

  try {
    return new amplitude.Identify();
  } catch (error) {
    console.warn('Failed to create Amplitude Identify instance:', error);
    return null;
  }
};

export { amplitude };
