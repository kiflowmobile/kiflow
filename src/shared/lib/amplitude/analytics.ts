import * as amplitude from '@amplitude/analytics-browser';

const AMPLITUDE_API_KEY = '64fd3a584ae35077dd93bea63cd25c3e';

let isInitialized = false;

/**
 * Initialize Amplitude analytics
 */
export const initAmplitude = (): void => {
  if (isInitialized) return;

  amplitude.init(AMPLITUDE_API_KEY, {
    defaultTracking: {
      sessions: true,
      pageViews: true,
    },
  });

  isInitialized = true;
};

/**
 * Log an event to Amplitude
 */
export const logAmplitudeEvent = (
  eventName: string,
  eventProps: Record<string, any> = {},
): void => {
  amplitude.track(eventName, eventProps);
};

/**
 * Set the user ID in Amplitude
 */
export const setAmplitudeUserId = (userId: string): void => {
  if (!userId) return;
  amplitude.setUserId(userId);
};

/**
 * Set user properties in Amplitude
 */
export const setAmplitudeUserProperties = (properties: Record<string, any>): void => {
  const identify = new amplitude.Identify();
  Object.entries(properties).forEach(([key, value]) => {
    identify.set(key, value);
  });
  amplitude.identify(identify);
};

/**
 * Create an Identify instance for setting user properties
 */
export const createIdentify = (): amplitude.Identify => {
  return new amplitude.Identify();
};

export { amplitude };
