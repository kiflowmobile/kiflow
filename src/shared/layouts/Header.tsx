import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/Colors';
import BackIcon from '@/src/assets/images/arrow-left.svg';

export interface HeaderProps {
  showBackButton?: boolean;
  title?: string;
  rightAction?: React.ReactNode;
  onBackPress?: () => void;
  fallbackRoute?: Href;
}

export function Header({
  showBackButton = true,
  title = '',
  rightAction,
  onBackPress,
  fallbackRoute = '/courses' as Href,
}: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }

    try {
      // @ts-ignore – canGoBack exists in newer versions
      if (router.canGoBack?.()) {
        router.back();
      } else {
        router.push(fallbackRoute);
      }
    } catch {
      router.push(fallbackRoute);
    }
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <BackIcon width={24} height={24} />
          </TouchableOpacity>
        )}

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.bg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'RobotoCondensed',
    fontWeight: '500',
    color: '#000',
  },
  rightAction: {
    marginLeft: 8,
  },
});
