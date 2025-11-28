import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  ImageBackground,
} from 'react-native';
import CloseIcon from '@/src/components/ui/CloseIcon';
import ArrowsUp from '@/src/assets/images/arrows-up.svg';
import { Colors } from '@/src/constants/Colors';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';

interface textData {
  content: string;
}

interface TextSlideProps {
  title: string;
  data: textData;
  subtitle?: string;
}

const TextSlide: React.FC<TextSlideProps> = ({ title, data, subtitle }) => {
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateYAnim, {
          toValue: -8,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );

    anim.start();
    return () => anim.stop();
  }, [translateYAnim]);

  return (
    <SafeAreaView style={styles.screen}>
      <ImageBackground
        source={require('@/src/assets/images/lesson-bg.png')}
        style={styles.imageBackground}
        imageStyle={styles.imageStyle}
      >
        <View style={styles.topLeft} pointerEvents="box-none">
          <CloseIcon size={22} color={Colors.white} />
        </View>

        <View style={styles.centerArea}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{subtitle}</Text>
          </View>

          <Text style={styles.title} accessibilityRole="header">
            {data.content}
          </Text>
        </View>

        <View style={styles.bottomArea} pointerEvents="box-none">
          <TouchableOpacity style={styles.swipeButton} activeOpacity={0.8}>
            <Animated.View
              style={[styles.chevrons, { transform: [{ translateY: translateYAnim }] }]}
            >
              <ArrowsUp width={32} height={32} />
            </Animated.View>
          </TouchableOpacity>
          <Text style={styles.swipeText}>Swipe up</Text>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

export default TextSlide;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.blue, position: 'relative' },
  imageBackground: { flex: 1, resizeMode: 'cover' },
  imageStyle: { width: '100%', height: '100%', opacity: 1 },
  topLeft: { position: 'absolute', left: 20, top: 20, zIndex: 30 },
  centerArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  pill: {
    backgroundColor: Colors.pink,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    marginBottom: 18,
  },
  pillText: { color: Colors.black, fontWeight: '600', fontFamily: 'RobotoCondensed', fontSize: 16 },
  title: {
    color: Colors.white,
    ...TEXT_VARIANTS.largeTitle,
  },
  bottomArea: { position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center' },
  swipeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  chevrons: { alignItems: 'center', justifyContent: 'center' },
  swipeText: { color: Colors.white, ...TEXT_VARIANTS.title3, marginTop: 8 },
});
