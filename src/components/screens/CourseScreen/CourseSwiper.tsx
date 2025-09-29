import { Slide } from "@/src/constants/types/slides";
import { useSlidesStore } from "@/src/stores";
import React, { useEffect, useMemo, useRef } from "react";
import {
  Dimensions,
  StyleSheet,
  View,
  FlatList,
  ViewToken,
} from "react-native";
import AICourseChat from "./slides/AICourseChat/AiCourseChat";
import ContentWithExample from "./slides/ContentWithExample";
import DashboardSlide from "./slides/DashboardSlide";
import MediaPlaceholder from "./slides/MediaPlaceholder";
import QuizSlide from "./slides/QuizeSlide";
import TextSlide from "./slides/TextSlide";
import VideoPlayer from "./VideoPlayer";

interface CourseSwiperProps {
  slides?: Slide[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const CourseSwiper: React.FC<CourseSwiperProps> = ({
  slides: propSlides,
  initialIndex = 0,
  onIndexChange,
}) => {
  const flatListRef = useRef<FlatList<Slide>>(null);
  const {
    slides: storeSlides,
    currentSlideIndex,
    setCurrentSlideIndex,
  } = useSlidesStore();

  const slides = useMemo(
    () => (storeSlides.length > 0 ? storeSlides : propSlides || []),
    [storeSlides, propSlides]
  );

  // Инициализация позиции FlatList
  useEffect(() => {
    if (slides.length === 0) return;
    const safeIndex = Math.min(Math.max(0, initialIndex), slides.length - 1);
    setCurrentSlideIndex(safeIndex);
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToIndex({ index: safeIndex, animated: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length, initialIndex]);

  useEffect(() => {
    if (!slides.length) return;
    flatListRef.current?.scrollToIndex({
      index: currentSlideIndex,
      animated: false,
    });
  }, [currentSlideIndex, slides.length]);

  const onViewableItemsChanged = useRef(
    (info: { viewableItems: Array<ViewToken<Slide>> }) => {
      if (info.viewableItems.length > 0) {
        const idx = info.viewableItems[0].index;
        if (typeof idx === "number" && idx !== currentSlideIndex) {
          setCurrentSlideIndex(idx);
          if (onIndexChange) onIndexChange(idx);
        }
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  // Рендер одного слайда
  const renderSlide = ({ item, index }: { item: Slide; index: number }) => {
    const isActive = index === currentSlideIndex;
    switch (item.slide_type) {
      case "text":
        return (
          <View style={{ width: SCREEN_W, height: SCREEN_H }}>
            <TextSlide title={item.slide_title} data={item.slide_data ?? ""} />
          </View>
        );
      case "video": {
        const { uri, mux } = item.slide_data.video || {};
        const hasVideo = !!uri || !!mux;
        return (
          <View style={{ width: SCREEN_W, height: SCREEN_H, backgroundColor: "#fff" }}>
            {hasVideo ? (
              <VideoPlayer
                uri={uri ?? undefined}
                mux={mux ?? undefined}
                isActive={isActive}
              />
            ) : (
              <MediaPlaceholder />
            )}
          </View>
        );
      }
      case "quiz":
        return (
          <View style={{ width: SCREEN_W, height: SCREEN_H }}>
            <QuizSlide title={item.slide_title} quiz={item.slide_data} />
          </View>
        );
      case "ai":
        return (
          <View style={{ width: SCREEN_W, height: SCREEN_H }}>
            <AICourseChat title={item.slide_title} slideId={item.id} />
          </View>
        );
      case "content":
        return (
          <View style={{ width: SCREEN_W, height: SCREEN_H }}>
            <ContentWithExample
              title={item.slide_title}
              mainPoint={item.slide_data.mainPoint}
              tips={item.slide_data.tips}
              example={item.slide_data.example}
            />
          </View>
        );
      case "dashboard":
        return (
          <View style={{ width: SCREEN_W, height: SCREEN_H }}>
            <DashboardSlide title={item.slide_title} />
          </View>
        );
      default:
        return (
          <View
            style={{
              width: SCREEN_W,
              height: SCREEN_H,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MediaPlaceholder
              message={`Слайд типу "${item.slide_type}" ще не підтримується`}
            />
          </View>
        );
    }
  };

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item, idx) => `${item.id}-${idx}`}
        renderItem={renderSlide}
        pagingEnabled
        horizontal={false}
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_H,
          offset: SCREEN_H * index,
          index,
        })}
        initialScrollIndex={currentSlideIndex}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      <View
        style={[
          styles.pagination,
          { top: SCREEN_H * 0.2, height: SCREEN_H * 0.6 },
        ]}
      >
        {slides.map((_, i) => {
          const active = i === currentSlideIndex;
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
  wrapper: { flex: 1, backgroundColor: "#fff" },
  pagination: {
    position: "absolute",
    right: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginVertical: 6,
  },
  dotActive: { backgroundColor: "#000000" },
  dotInactive: { backgroundColor: "#CFCFCF" },
});
