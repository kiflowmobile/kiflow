import { Lesson, Module, Slide } from "@/lib/types";
import React, { memo } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { SharedValue } from "react-native-reanimated";
import { SCREEN_HEIGHT } from "../styles";
import { SlideComponent } from "./SlideComponent";

export interface SlideWrapperProps {
  index: number;
  scrollY: SharedValue<number>;
  slide: Slide;
  module: Module;
  lesson: Lesson;
  onNext: () => void;
  onPrevious: () => void;
  onClose?: () => void;
  isActive?: boolean;
}

export const SlideWrapper = memo(function SlideWrapper({ onNext, onPrevious, ...props }: SlideWrapperProps) {
  const swipeGesture = Gesture.Pan()
    .onEnd((event) => {
      const { translationY, velocityY } = event;
      const SWIPE_THRESHOLD = 50;
      const VELOCITY_THRESHOLD = 500;

      if (translationY < -SWIPE_THRESHOLD || velocityY < -VELOCITY_THRESHOLD) {
        onNext();
      } else if (translationY > SWIPE_THRESHOLD || velocityY > VELOCITY_THRESHOLD) {
        onPrevious();
      }
    })
    .activeOffsetY([-10, 10]);

  return (
    <GestureDetector gesture={swipeGesture}>
      <View style={{ height: SCREEN_HEIGHT }} className="flex-1">
        <SlideComponent onNext={onNext} {...props} />
      </View>
    </GestureDetector>
  );
});
