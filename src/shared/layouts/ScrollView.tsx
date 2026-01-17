import React from 'react';
import {
  ScrollView as RNScrollView,
  ScrollViewProps,
  StyleSheet,
  RefreshControl,
} from 'react-native';

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
      style={[styles.container, style]}
      contentContainerStyle={styles.content}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
});
