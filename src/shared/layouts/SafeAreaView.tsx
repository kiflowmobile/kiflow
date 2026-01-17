import React from 'react';
import { SafeAreaView as RNSafeAreaView, ViewProps, StyleSheet } from 'react-native';
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
  if (useContext && edges) {
    return (
      <SAVContext edges={edges} style={[styles.container, style]} {...props}>
        {children}
      </SAVContext>
    );
  }

  return (
    <RNSafeAreaView style={[styles.container, style]} {...props}>
      {children}
    </RNSafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
