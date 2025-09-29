import { Slide } from "@/src/constants/types/slides";
import { useSlidesStore } from "@/src/stores";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import AICourseChat from "./slides/AICourseChat/AiCourseChat";
import ContentWithExample from "./slides/ContentWithExample";
import DashboardSlide from "./slides/DashboardSlide";
import MediaPlaceholder from "./slides/MediaPlaceholder";
import QuizSlide from "./slides/QuizeSlide";
import TextSlide from "./slides/TextSlide";
import VideoPlayer from "./VideoPlayer";
import { useSlideHeight } from "./useSlideHeight";

interface CourseSwiperProps {
  slides?: Slide[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  totalSlides?: number;
}

const CourseSwiper: React.FC<CourseSwiperProps> = ({
  slides: propSlides,
  initialIndex = 0,
  onIndexChange,
  totalSlides: propTotalSlides,
}) => {
  const { width, height } = useWindowDimensions();
  const scrollRef = useRef<Animated.ScrollView | null>(null);
  const {
    slides: storeSlides,
    currentSlideIndex,
    setCurrentSlideIndex,
  } = useSlidesStore();
  // Use viewport height for snapping to avoid Safari toolbar resizing issues
  const [isKeyboardOpen, setKeyboardOpen] = useState(false);


  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleFocus = () => setKeyboardOpen(true);
      const handleBlur = () => setKeyboardOpen(false);
      window.addEventListener('focusin', handleFocus);
      window.addEventListener('focusout', handleBlur);
      return () => {
        window.removeEventListener('focusin', handleFocus);
        window.removeEventListener('focusout', handleBlur);
      };
    }
  }, []);


  
  const pageHeight = useSlideHeight();

  const slides = useMemo(
    () => (storeSlides.length > 0 ? storeSlides : propSlides || []),
    [storeSlides, propSlides]
  );

  const currentIndex = currentSlideIndex;

  const didInitRef = useRef(false);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const viewH = event.layoutMeasurement?.height || pageHeight;
      const idx = Math.round(event.contentOffset.y / viewH);
      runOnJS(setCurrentSlideIndex)(idx);
      if (onIndexChange) runOnJS(onIndexChange)(idx);
    },
  });

  useEffect(() => {
    if (slides.length === 0) return;

    const safeIndex = Math.min(Math.max(0, initialIndex), slides.length - 1);

    if (!didInitRef.current) {
      didInitRef.current = true;
      setCurrentSlideIndex(safeIndex);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: safeIndex * pageHeight, animated: false });
      });
    }
  }, [slides.length, initialIndex, pageHeight, setCurrentSlideIndex]);


  useEffect(() => {
    if (!slides.length) return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        y: currentIndex * pageHeight,
        animated: false,
      });
    });
  }, [currentIndex, slides.length, pageHeight]);

  

  const renderSlide = (slide: Slide, index: number) => {
    const isActive = index === currentIndex;
    const key = `${slide.id}-${index}`;
    switch (slide.slide_type) {
      case "text":
        return (
          <View key={key} style={{ width, height }}>
            <TextSlide
              title={slide.slide_title}
              data={slide.slide_data ?? ""}
            />
          </View>
        );

      // case "video": {
      //   const { uri, mux } = slide.slide_data.video || {};
      //   const hasVideo = !!uri || !!mux;
      //   return (
      //     <View key={key} className="flex-1 bg-white dark:bg-neutral-900">
      //       {hasVideo ? (
      //         <VideoPlayer
      //           uri={uri ?? undefined}
      //           mux={mux ?? undefined}
      //           isActive={isActive}
      //         />
      //       ) : (
      //         <MediaPlaceholder />
      //       )}
      //     </View>
      //   );
      // }

      case "quiz":
        return (
          <View key={key} style={{ width, height }}>
            <QuizSlide title={slide.slide_title} quiz={slide.slide_data} />
          </View>
        );

      case "ai":
        return (
          <View key={key} style={{width, height , touchAction: 'manipulation' }}>
            <AICourseChat title={slide.slide_title} slideId={slide.id} />
          </View>
        );

      // case "content":
      //   return (
      //     <View key={key} style={{ width, height }}>
      //       <ContentWithExample
      //         title={slide.slide_title}
      //         mainPoint={slide.slide_data.mainPoint}
      //         tips={slide.slide_data.tips}
      //         example={slide.slide_data.example}
      //       />
      //     </View>
      //   );

      case "dashboard":
        return (
          <View key={key} style={{ width, height }}>
            <DashboardSlide title={slide.slide_title} />
          </View>
        );

      default:
        return (
          <View
            key={slide.id}
            style={{
              width,
              height,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MediaPlaceholder
              message={`Слайд типу "${slide.slide_type}" ще не підтримується`}
            />
          </View>
        );
    }
  };

  return (
    <View style={styles.wrapper}>
      <Animated.ScrollView
        key={slides.length}
        ref={scrollRef}
        pagingEnabled
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={false}
        // Improve Safari behavior
        // snapToInterval={pageHeight}
        snapToInterval={Platform.OS === 'web' && isKeyboardOpen ? undefined : pageHeight}

        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        overScrollMode="never"
        directionalLockEnabled
        keyboardShouldPersistTaps="handled"  // дозволяє тапу на інпут проходити
        contentContainerStyle={{ touchAction: 'manipulation' }} // Safari iOS
      
      >
        {slides.map((s, i) => renderSlide(s, i))}
      </Animated.ScrollView>

      <View
        style={[styles.pagination, { top: height * 0.2, height: height * 0.6 }]}
      >
        {slides.map((_, i) => {
          const active = i === currentIndex;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                active ? styles.dotActive : styles.dotInactive,
                active && { height: 18, width: 18, borderRadius: 9 },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

export default CourseSwiper;

const styles = StyleSheet.create({
  wrapper: {flex: 1},
  pagination: {
    position: "absolute",
    right: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginVertical: 6,
  },
  dotActive: { backgroundColor: "#4CAF50" },
  dotInactive: { backgroundColor: "#CFCFCF" },
});
