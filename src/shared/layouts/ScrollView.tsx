import React from 'react';
import { ScrollView as RNScrollView, ScrollViewProps, RefreshControl } from 'react-native';

interface ScrollViewLayoutProps extends ScrollViewProps {
  className?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function ScrollView({
  children,
  className,
  style,
  refreshing,
  onRefresh,
  ...props
}: ScrollViewLayoutProps) {
  return (
    <RNScrollView
      className={className || 'flex-1'}
      style={style}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} />
        ) : undefined
      }
      {...props}
    >
      {children}
    </RNScrollView>
  );
}
