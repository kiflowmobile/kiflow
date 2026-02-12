import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconSymbol } from './icon-symbol';
import { Typography } from './typography';

function getMobilePlatform() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // Check for Android
  if (/android/i.test(userAgent)) {
    return 'Android';
  }

  // Check for iOS (iPhone, iPad, iPod)
  // Note: Modern iPads often report as "MacIntel", so we check for touch points.
  if (
    /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  ) {
    return 'iOS';
  }

  return 'Desktop/Other';
}

export function PortraitModeGuard() {
  const isIos = getMobilePlatform() === 'iOS';
  const isAndroid = getMobilePlatform() === 'Android';
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const handleOrientationChange = () => {
      setIsLandscape(
        screen.orientation.type === 'landscape-primary' ||
          screen.orientation.type === 'landscape-secondary',
      );
    };

    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  if ((isIos || isAndroid) && isLandscape) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <IconSymbol name="rotate.left" size={64} color="#0A0A0A" />
          <Typography variant="title2" style={styles.text}>
            Please rotate your phone to portrait mode
          </Typography>
        </View>
      </View>
    );
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
