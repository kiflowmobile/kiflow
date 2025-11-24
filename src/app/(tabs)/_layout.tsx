import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { IconSymbol } from '@/src/components/ui/IconSymbol';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import CustomHeader from '@/src/components/ui/CustomHeader';

export default function TabsLayout() {
  const analyticsStore = useAnalyticsStore.getState();

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
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol name="book.fill" size={24} color={color} />
          ),
          headerShown: true,
          header: () => <CustomHeader showBackButton={false} title="Courses" />,
        }}
        listeners={{
          focus: () => analyticsStore.trackEvent('tab_bar__courses__click'),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol name="chart.bar.fill" size={24} color={color} />
          ),
        }}
        listeners={{
          focus: () => analyticsStore.trackEvent('tab_bar__results__click'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol name="person.fill" size={24} color={color} />
          ),
        }}
        listeners={{
          focus: () => analyticsStore.trackEvent('tab_bar__profile__click'),
        }}
      />
    </Tabs>
  );
}


