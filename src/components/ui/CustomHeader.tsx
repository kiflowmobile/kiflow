// src/components/CustomHeader.tsx
import { Href, useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomHeader() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const navigateToHome = () => {
    router.push('/courses' as Href);
  };

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <TouchableOpacity style={styles.logoWrap} onPress={navigateToHome}>
        <Image source={require('@/src/assets/images/kiflow-logo.jpeg')} style={styles.logoImage} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  logoWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 200,
    height: 40,
    resizeMode: 'contain',
    marginTop: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
});
