import { DoubleChevronUpIcon } from "@/components/icons/double-chevron-up-icon";
import { Lesson, Module, Slide } from "@/lib/types";
import { Image } from "expo-image";
import { useEffect } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SCREEN_HEIGHT, SCREEN_WIDTH } from "../styles";

interface CoverSlideProps {
  slide: Slide;
  module?: Module | null;
  lesson?: Lesson | null;
  onNext: () => void;
  onClose?: () => void;
}

export function CoverSlide({ slide, module, lesson, onNext }: CoverSlideProps) {
  const content = slide.content as any;
  const swipeAnim = useSharedValue(0);

  useEffect(() => {
    swipeAnim.value = withRepeat(
      withSequence(withTiming(-10, { duration: 1000 }), withTiming(0, { duration: 1000 })),
      -1, // Indefinite repeat
      true // Reverse
    );
  }, [swipeAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: swipeAnim.value }],
  }));

  return (
    <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
      <Image
        source={require("@/assets/images/lesson-bg.jpg")}
        className="absolute inset-0"
        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
      />

      <View
        className="flex-col items-center justify-center px-4"
        style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
      >
        <View className="bg-[#FFCCD8] rounded-full px-3 py-1.5 mb-2">
          <Text className="text-caption font-bold">
            Module {module?.order_index ?? 1} / Lesson {lesson?.order_index ?? 1}
          </Text>
        </View>

        <Text className="text-title-0 text-white text-center">{lesson?.title || content.title || slide.content}</Text>
      </View>

      <TouchableOpacity className="absolute bottom-16 left-0 right-0 items-center" onPress={onNext} activeOpacity={0.8}>
        <Animated.View
          style={animatedStyle}
          className="w-16 h-16 rounded-full bg-[#0A0A0A] justify-center items-center mb-2"
        >
          <DoubleChevronUpIcon width={32} height={32} color="#FFFFFF" />
        </Animated.View>

        <Text className="text-caption text-white">Swipe up</Text>
      </TouchableOpacity>
    </View>
  );
}
