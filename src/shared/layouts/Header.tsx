import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    <View className="bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-3 py-4">
        {showBackButton && (
          <TouchableOpacity
            className="mr-2"
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <BackIcon width={24} height={24} />
          </TouchableOpacity>
        )}

        <Text className="flex-1 text-base font-primary font-medium text-black" numberOfLines={1}>
          {title}
        </Text>

        {rightAction && <View className="ml-2">{rightAction}</View>}
      </View>
    </View>
  );
}
