import { Href, useRouter } from 'expo-router';
import BackIcon from '@/src/assets/images/arrow-left.svg';
import { TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type CustomHeaderProps = {
  showBackButton?: boolean;
  title?: string;
};

export function CustomHeader({ showBackButton = true, title = 'Courses' }: CustomHeaderProps) {
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

        <Text className="text-base font-primary font-medium text-black">{title}</Text>
      </View>
    </View>
  );
}
