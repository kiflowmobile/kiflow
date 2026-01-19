import React from 'react';

import CoursesIconActive from '@/src/assets/images/courses-active.svg';
import CoursesIconInactive from '@/src/assets/images/courses-inactive.svg';
import ProgressIconActive from '@/src/assets/images/progress-active.svg';
import ProgressIconInactive from '@/src/assets/images/progress-inactive.svg';
import ProfileIconActive from '@/src/assets/images/profile-active.svg';
import ProfileIconInactive from '@/src/assets/images/profile-inactive.svg';

type TabName = 'courses' | 'progress' | 'profile';

const ICONS: Record<TabName, { active: React.FC<{ width: number; height: number }>; inactive: React.FC<{ width: number; height: number }> }> = {
  courses: { active: CoursesIconActive, inactive: CoursesIconInactive },
  progress: { active: ProgressIconActive, inactive: ProgressIconInactive },
  profile: { active: ProfileIconActive, inactive: ProfileIconInactive },
};

interface TabBarIconProps {
  name: TabName;
  focused: boolean;
}

export function TabBarIcon({ name, focused }: TabBarIconProps) {
  const { active: ActiveIcon, inactive: InactiveIcon } = ICONS[name];
  const size = 24;

  return focused ? (
    <ActiveIcon width={size} height={size} />
  ) : (
    <InactiveIcon width={size} height={size} />
  );
}

export const createTabBarIcon = (name: TabName) => {
  const TabBarIconComponent = ({ focused }: { focused: boolean }) => (
    <TabBarIcon name={name} focused={focused} />
  );

  TabBarIconComponent.displayName = `TabBarIcon(${name})`;

  return TabBarIconComponent;
};