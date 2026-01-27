import { Tabs } from 'expo-router';
import React from 'react';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';

import { HapticTab } from '@/components/haptic-tab';
import { CourseIcon } from '@/components/icons/course-icon';
import { ProfileIcon } from '@/components/icons/profile-icon';
import { ProgressIcon } from '@/components/icons/progress-icon';

export default function TabLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#0A0A0A',
          tabBarInactiveTintColor: '#A1A1A1',
          tabBarStyle: {
            height: 64,
            paddingTop: 10,
            paddingBottom: 12,
          },
          headerShown: false,
          tabBarButton: HapticTab,
        }}
      >
        <Tabs.Screen
          name="courses"
          options={{
            title: 'Courses',
            tabBarIcon: ({ color }) => <CourseIcon width={24} height={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color }) => <ProgressIcon width={24} height={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <ProfileIcon width={24} height={24} color={color} />,
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}
