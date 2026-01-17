import { Colors } from '@/src/constants/Colors';
import { Href, useRouter } from 'expo-router';
import BackIcon from '@/src/assets/images/arrow-left.svg';

import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CustomHeaderProps = {
  showBackButton?: boolean;
  title?: string;
};

export default function CustomHeader({
  showBackButton = true,
  title = 'Courses',
}: CustomHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    try {
      // @ts-ignore – canGoBack есть в новых версиях
      if (router.canGoBack?.()) {
        router.back();
      } else {
        router.push('/courses' as Href);
      }
    } catch {
      router.push('/courses' as Href);
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

        <Text style={styles.title}>{title}</Text>
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
    fontSize: 16,
    fontFamily: 'RobotoCondensed',
    fontWeight: '500',
    color: '#000',
  },
});
