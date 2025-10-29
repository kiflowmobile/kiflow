import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { IconSymbol } from '@/src/components/ui/IconSymbol';

export default function TabsLayout() {
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
      }}
    >
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol name="book.fill" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol name="chart.bar.fill" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol name="person.fill" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}


