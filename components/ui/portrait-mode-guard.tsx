import React from 'react';
import { StyleSheet, View, useWindowDimensions, Platform } from 'react-native';
import { IconSymbol } from './icon-symbol';
import { Typography } from './typography';

export function PortraitModeGuard() {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const isIos = Platform.OS === 'ios' && Platform.isPad;
  const isAndroid = Platform.OS === 'android';

  if ((isIos || isAndroid) && isLandscape) {
    <View style={styles.container}>
      <View style={styles.content}>
        <IconSymbol name="rotate.left" size={64} color="#0A0A0A" />
        <Typography variant="title2" style={styles.text}>
          Please rotate your phone to portrait mode
        </Typography>
      </View>
    </View>;
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 20,
    padding: 20,
  },
  text: {
    textAlign: 'center',
    marginTop: 16,
  },
});
