import React from 'react';
import { SafeAreaView as RNSafeAreaView, ViewProps } from 'react-native';
import { SafeAreaView as SAVContext } from 'react-native-safe-area-context';
import clsx from 'clsx';

interface SafeAreaViewProps extends ViewProps {
  className?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  useContext?: boolean;
}

export function SafeAreaView({
  children,
  className,
  style,
  edges,
  useContext = true,
  ...props
}: SafeAreaViewProps) {
  const containerClassName = clsx('flex-1', className);

  if (useContext && edges) {
    return (
      <SAVContext edges={edges} className={containerClassName} style={style} {...props}>
        {children}
      </SAVContext>
    );
  }

  return (
    <RNSafeAreaView className={containerClassName} style={style} {...props}>
      {children}
    </RNSafeAreaView>
  );
}
