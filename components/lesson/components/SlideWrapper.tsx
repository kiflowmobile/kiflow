import { Lesson, Module, Slide } from "@/lib/types";
import React, { memo } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, SharedValue } from "react-native-reanimated";
import { ScrollableSlideProvider, useScrollableSlide } from "../context/ScrollableSlideContext";
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

function SlideWrapperInner({ onNext, onPrevious, ...props }: SlideWrapperProps) {
  const { isAtTop, isAtBottom, isScrollable } = useScrollableSlide();

  const swipeGesture = Gesture.Pan()
    .onEnd((event) => {
      "worklet";
      const { translationY, velocityY } = event;
      const SWIPE_THRESHOLD = 50;
      const VELOCITY_THRESHOLD = 500;

      const isSwipingUp = translationY < -SWIPE_THRESHOLD || velocityY < -VELOCITY_THRESHOLD;
      const isSwipingDown = translationY > SWIPE_THRESHOLD || velocityY > VELOCITY_THRESHOLD;

      // If slide has scrollable content, only allow page navigation at boundaries
      if (isScrollable.value) {
        if (isSwipingUp && isAtBottom.value) {
          runOnJS(onNext)();
        } else if (isSwipingDown && isAtTop.value) {
          runOnJS(onPrevious)();
        }
      } else {
        // Non-scrollable slide - allow normal navigation
        if (isSwipingUp) {
          runOnJS(onNext)();
        } else if (isSwipingDown) {
          runOnJS(onPrevious)();
        }
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
}

export const SlideWrapper = memo(function SlideWrapper(props: SlideWrapperProps) {
  return (
    <ScrollableSlideProvider>
      <SlideWrapperInner {...props} />
    </ScrollableSlideProvider>
  );
});
