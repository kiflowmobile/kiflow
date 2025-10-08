import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { Text } from '@/src/components/ui/text';

interface SwipePaginationProps {
  currentIndex: number;
  totalSlides: number;
  swipeIndicatorStyle: StyleProp<AnimatedStyle<ViewStyle>>;
}

const SwipePagination: React.FC<SwipePaginationProps> = ({
  currentIndex,
  totalSlides,
  swipeIndicatorStyle,
}) => {
  return (
    <Animated.View
      style={[swipeIndicatorStyle]}
      className="absolute bottom-0 left-0 right-0 mb-5 items-center"
    >
      <MaterialIcons name="keyboard-arrow-up" size={32} color="background-0" />
      <Text className="mt-1 text-sm font-[Inter_400Regular] text-background-0 opacity-80">
        {currentIndex === totalSlides - 1 ? '' : 'Проведіть вгору для продовження'}
      </Text>
    </Animated.View>
  );
};

export default SwipePagination;
