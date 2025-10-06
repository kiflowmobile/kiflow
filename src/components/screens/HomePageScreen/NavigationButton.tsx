import Button from '@/src/components/ui/button';
import type { LucideIcon } from 'lucide-react-native';
import React from 'react';

export type AppRoute =
  | '/'
  | '/admin'
  | '/ai-chat'
  | '/auth/forgot-password'
  | '/auth/login'
  | '/ai-instructions'
  | '/course'
  | '/courses'
  | '/profile'
  | '/real-estate-simulator'
  | '/+not-found'
  | '/statistics'
  | '/company-dashboard';

interface NavigationButtonProps {
  route: AppRoute;
  icon?: LucideIcon;
  label: string;
  onNavigate: (route: AppRoute) => void;
  variant?: 'primary' | 'secondary' | 'success' | 'error';
  size?: 'sm' | 'md' | 'lg';
  style?: any;
}

export const NavigationButton: React.FC<NavigationButtonProps> = ({
  route,
  icon,
  label,
  onNavigate,
  variant = 'secondary',
  size = 'md',
  style,
}) => {
  return (
    <Button
      title={label.toUpperCase()}
      variant={variant}
      size={size}
      onPress={() => onNavigate(route)}
      style={style}
    />
  );
};