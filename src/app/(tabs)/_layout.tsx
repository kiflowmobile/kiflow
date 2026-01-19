import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { useAnalytics } from '@/features/analytics';
import { Header } from '@/shared/components/header';
import { createTabBarIcon } from '../components/TabBarIcon';

interface TabConfig {
  name: string;
  title: string;
  headerTitle?: string;
  showHeader?: boolean;
  analyticsEvent: string;
}

// Tab names
export const TAB_NAMES = {
  COURSES: 'courses',
  PROGRESS: 'progress',
  PROFILE: 'profile',
} as const;

export const ANALYTICS_EVENTS = {
  // Tab bar navigation
  TAB_BAR: {
    COURSES_CLICK: 'tab_bar__courses__click',
    PROGRESS_CLICK: 'tab_bar__results__click',
    PROFILE_CLICK: 'tab_bar__profile__click',
  },

  // Screen loads
  SCREEN: {
    HOME_LOAD: 'home_screen__load',
    COURSES_LOAD: 'courses_screen__load',
    PROGRESS_LOAD: 'progress_screen__load',
    PROFILE_LOAD: 'profile_screen__load',
  },
} as const;

const TAB_CONFIG: TabConfig[] = [
  {
    name: TAB_NAMES.COURSES,
    title: 'Courses',
    headerTitle: 'Courses',
    showHeader: true,
    analyticsEvent: ANALYTICS_EVENTS.TAB_BAR.COURSES_CLICK,
  },
  {
    name: TAB_NAMES.PROGRESS,
    title: 'Progress',
    headerTitle: 'Your Progress',
    showHeader: true,
    analyticsEvent: ANALYTICS_EVENTS.TAB_BAR.PROGRESS_CLICK,
  },
  {
    name: TAB_NAMES.PROFILE,
    title: 'Profile',
    showHeader: false,
    analyticsEvent: ANALYTICS_EVENTS.TAB_BAR.PROFILE_CLICK,
  },
];

export const TAB_BAR_STYLE = {
  borderTopWidth: 0,
  backgroundColor: "#ffffff",
  height: 64,
} as const;

export default function TabsLayout() {
  const { trackEvent } = useAnalytics();

  return (
    <Tabs
      initialRouteName={TAB_NAMES.COURSES}
      screenOptions={{
        tabBarActiveTintColor: "#000000",
        tabBarInactiveTintColor: "#9ca3af",
        headerShown: false,
        tabBarBackground: Platform.select({ default: undefined }),
        tabBarStyle: TAB_BAR_STYLE,
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: createTabBarIcon(tab.name as 'courses' | 'progress' | 'profile'),
            headerShown: tab.showHeader,
            header: tab.showHeader
              ? () => <Header showBackButton={false} title={tab.headerTitle} />
              : undefined,
          }}
          listeners={{
            focus: () => trackEvent(tab.analyticsEvent),
          }}
        />
      ))}
    </Tabs>
  );
}
