import React, { createContext, ReactNode, useCallback, useContext, useRef } from "react";
import { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { SharedValue, useSharedValue } from "react-native-reanimated";

interface ScrollableSlideContextType {
  isAtTop: SharedValue<boolean>;
  isAtBottom: SharedValue<boolean>;
  isScrollable: SharedValue<boolean>;
  contentHeight: SharedValue<number>;
  containerHeight: SharedValue<number>;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleContentSizeChange: (width: number, height: number) => void;
  handleLayout: (height: number) => void;
  setScrollable: (scrollable: boolean) => void;
}

const ScrollableSlideContext = createContext<ScrollableSlideContextType | undefined>(undefined);

export function ScrollableSlideProvider({ children }: { children: ReactNode }) {
  const isAtTop = useSharedValue(true);
  const isAtBottom = useSharedValue(true);
  const isScrollable = useSharedValue(false);
  const contentHeight = useSharedValue(0);
  const containerHeight = useSharedValue(0);

  const scrollOffsetRef = useRef(0);

  const updateBoundaryState = useCallback(() => {
    const maxScroll = contentHeight.value - containerHeight.value;
    const hasScrollableContent = maxScroll > 1;

    isScrollable.value = hasScrollableContent;

    if (!hasScrollableContent) {
      isAtTop.value = true;
      isAtBottom.value = true;
    } else {
      isAtTop.value = scrollOffsetRef.current <= 1;
      isAtBottom.value = scrollOffsetRef.current >= maxScroll - 1;
    }
  }, [contentHeight, containerHeight, isScrollable, isAtTop, isAtBottom]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
      updateBoundaryState();
    },
    [updateBoundaryState]
  );

  const handleContentSizeChange = useCallback(
    (_width: number, height: number) => {
      contentHeight.value = height;
      updateBoundaryState();
    },
    [contentHeight, updateBoundaryState]
  );

  const handleLayout = useCallback(
    (height: number) => {
      containerHeight.value = height;
      updateBoundaryState();
    },
    [containerHeight, updateBoundaryState]
  );

  const setScrollable = useCallback(
    (scrollable: boolean) => {
      isScrollable.value = scrollable;
      if (!scrollable) {
        isAtTop.value = true;
        isAtBottom.value = true;
      }
    },
    [isScrollable, isAtTop, isAtBottom]
  );

  return (
    <ScrollableSlideContext.Provider
      value={{
        isAtTop,
        isAtBottom,
        isScrollable,
        contentHeight,
        containerHeight,
        handleScroll,
        handleContentSizeChange,
        handleLayout,
        setScrollable,
      }}
    >
      {children}
    </ScrollableSlideContext.Provider>
  );
}

export function useScrollableSlide() {
  const context = useContext(ScrollableSlideContext);
  if (context === undefined) {
    throw new Error("useScrollableSlide must be used within a ScrollableSlideProvider");
  }
  return context;
}
