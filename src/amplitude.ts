import * as amplitude from '@amplitude/analytics-browser';

// const AMPLITUDE_API_KEY = '8660277aab89be5aa18818f42dc68c3a'


export const initAmplitude = (): void => {
  // amplitude.init(AMPLITUDE_API_KEY, {
  //   defaultTracking: {
  //     sessions: true,
  //     pageViews: true,
  //   },
  // });
};

export const logEvent = (
  eventName: string, 
  eventProps: Record<string, any> = {}
): void => {
  amplitude.track(eventName, eventProps);
};
