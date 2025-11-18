import * as amplitude from '@amplitude/analytics-browser';

const AMPLITUDE_API_KEY = '64fd3a584ae35077dd93bea63cd25c3e';
// const AMPLITUDE_API_KEY = '67074b46d11e269caf48c26189ce2139';


export const initAmplitude = (): void => {
  amplitude.init(AMPLITUDE_API_KEY, {
    defaultTracking: {
      sessions: true,
      pageViews: true,
    },
  });
};

export const logEvent = (
  eventName: string, 
  eventProps: Record<string, any> = {}
): void => {
  amplitude.track(eventName, eventProps);
};
