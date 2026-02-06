import { cn } from '@/lib/utils';
import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, Text } from 'react-native';

type ButtonSize = 'medium' | 'big';

interface ButtonProps extends PressableProps {
  children: React.ReactNode;
  loading?: boolean;
  textClassName?: string;
  size?: ButtonSize;
}

export function Button({
  disabled,
  children,
  loading = false,
  size = 'medium',
  className,
  textClassName,
  onPress,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...props}
      className={cn(
        size === 'big' ? 'min-h-[56px] py-4' : 'min-h-[48px] py-3',
        'bg-text rounded-lg flex items-center justify-center text-lg font-semibold',
        isDisabled && 'opacity-20',
        className,
      )}
      onPress={isDisabled ? undefined : onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className={cn('text-white text-lg font-title font-semibold', textClassName)}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}
