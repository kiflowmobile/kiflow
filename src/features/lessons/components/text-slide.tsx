import React, { useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity, Animated, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ArrowsUp from '@/src/assets/images/arrows-up.svg';

interface textData {
  content: string;
}

interface TextSlideProps {
  title: string;
  data: textData;
  subtitle?: string;
}

export const TextSlide: React.FC<TextSlideProps> = ({ title, data, subtitle }) => {
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
    <SafeAreaView className="flex-1 relative bg-primary">
      <ImageBackground
        source={require('@/src/assets/images/lesson-bg.png')}
        className="flex-1"
        imageStyle={{ resizeMode: 'cover', width: '100%', height: '100%', opacity: 1 }}
      >
        <View className="flex-1 justify-center items-center px-6">
          {subtitle && (
            <View className="bg-pink px-4 py-2 rounded-3xl mb-4.5">
              <Text className="text-black font-semibold font-primary text-base">{subtitle}</Text>
            </View>
          )}

          <Text className="text-white text-xl font-semibold text-center" accessibilityRole="header">
            {data.content}
          </Text>
        </View>

        <View className="absolute bottom-4 left-0 right-0 items-center" pointerEvents="box-none">
          <TouchableOpacity
            className="w-16 h-16 rounded-full bg-black items-center justify-center"
            activeOpacity={0.8}
            style={{ elevation: 6 }}
          >
            <Animated.View
              className="items-center justify-center"
              style={{ transform: [{ translateY: translateYAnim }] }}
            >
              <ArrowsUp width={32} height={32} />
            </Animated.View>
          </TouchableOpacity>
          <Text className="text-white text-base font-semibold mt-2">Swipe up</Text>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

