import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { useAnalytics } from '@/features/analytics';
import { Header } from '@/shared/components/header';

import CoursesIconActive from '@/src/assets/images/courses-active.svg';
import CoursesIconInactive from '@/src/assets/images/courses-inactive.svg';

import ProgressIconActive from '@/src/assets/images/progress-active.svg';
import ProgressIconInactive from '@/src/assets/images/progress-inactive.svg';

import ProfileIconActive from '@/src/assets/images/profile-active.svg';
import ProfileIconInactive from '@/src/assets/images/profile-inactive.svg';

export default function TabsLayout() {
  const { trackEvent } = useAnalytics();

  return (
    <Tabs
      initialRouteName="courses"
      screenOptions={{
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
        tabBarBackground: Platform.select({
          default: undefined,
        }),
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: '#ffffff',
          height: 64,
        },
      }}
    >
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ focused }: { focused: boolean; color: string; size: number }) =>
            focused ? (
              <CoursesIconActive width={24} height={24} />
            ) : (
              <CoursesIconInactive width={24} height={24} />
            ),
          headerShown: true,
          header: () => <Header showBackButton={false} title="Courses" />,
        }}
        listeners={{
          focus: () => trackEvent('tab_bar__courses__click'),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          headerShown: true,
          header: () => <Header showBackButton={false} title="Your Progress" />,
          tabBarIcon: ({ focused }: { focused: boolean; color: string; size: number }) =>
            focused ? (
              <ProgressIconActive width={24} height={24} />
            ) : (
              <ProgressIconInactive width={24} height={24} />
            ),
        }}
        listeners={{
          focus: () => trackEvent('tab_bar__results__click'),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }: { focused: boolean; color: string; size: number }) =>
            focused ? (
              <ProfileIconActive width={24} height={24} />
            ) : (
              <ProfileIconInactive width={24} height={24} />
            ),
        }}
        listeners={{
          focus: () => trackEvent('tab_bar__profile__click'),
        }}
      />
    </Tabs>
  );
}
