import React, { useMemo, useRef, useEffect, useCallback } from 'react';
import {
  useWindowDimensions,
  StyleSheet,
  View,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Slide } from '@/src/constants/types/slides';
import { useSlidesStore } from '@/src/stores';
import AICourseChat from './slides/AICourseChat/AiCourseChat';
import ContentWithExample from './slides/ContentWithExample';
import DashboardSlide from './slides/DashboardSlide';
import MediaPlaceholder from './slides/MediaPlaceholder';
import QuizSlide from './slides/QuizeSlide';
import TextSlide from './slides/TextSlide';
import VideoPlayer from './VideoPlayer';

interface CourseSwiperProps {
  slides?: Slide[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
}

const CourseSwiper: React.FC<CourseSwiperProps> = ({
  slides: propSlides,
  initialIndex = 0,
  onIndexChange,
}) => {
  const { height: SCREEN_H, width: SCREEN_W } = useWindowDimensions();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const isProgrammatic = useRef(false);

  const { slides: storeSlides, currentSlideIndex, setCurrentSlideIndex } = useSlidesStore();
  

  const slides = useMemo(
    () => (storeSlides.length > 0 ? storeSlides : propSlides || []),
    [storeSlides, propSlides],
  );

  useEffect(() => {
    if (!slides.length) return;
    const safe = Math.min(Math.max(0, initialIndex), slides.length - 1);
    setCurrentSlideIndex(safe);
    isProgrammatic.current = true;
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToIndex({ index: safe, animated: false });
      requestAnimationFrame(() => (isProgrammatic.current = false));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isProgrammatic.current) return;
      const y = e.nativeEvent.contentOffset.y;
      const idx = Math.round(y / SCREEN_H);
      if (idx !== currentSlideIndex) {
        setCurrentSlideIndex(idx);
        onIndexChange?.(idx);
      }
    },
    [SCREEN_H, currentSlideIndex, onIndexChange, setCurrentSlideIndex],
  );

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isProgrammatic.current) return;
      const y = e.nativeEvent.contentOffset.y;
      const idx = Math.round(y / SCREEN_H);
      if (idx !== currentSlideIndex) {
        setCurrentSlideIndex(idx);
        onIndexChange?.(idx);
      }
    },
    [SCREEN_H, currentSlideIndex, onIndexChange, setCurrentSlideIndex],
  );

  const renderSlide = ({ item, index }: { item: Slide; index: number }) => {
    const isActive = index === currentSlideIndex;
    switch (item.slide_type) {
      case 'text':
        return (
          <View style={{ width: SCREEN_W, height: SCREEN_H }}>
            <TextSlide title={item.slide_title} data={item.slide_data ?? ''} />
          </View>
        );
      case 'video': {
        const { uri, mux } = item.slide_data?.video || {};
        const hasVideo = !!uri || !!mux;
        return (
          <View style={{ width: SCREEN_W, height: SCREEN_H, backgroundColor: '#fff' }}>
            {hasVideo ? (
              <VideoPlayer uri={uri ?? undefined} mux={mux ?? undefined} isActive={isActive} />
            ) : (
              <MediaPlaceholder />
            )}
          </View>
        );
      }
      case 'quiz':
        return (
          <View style={{ width: SCREEN_W, height: SCREEN_H }}>
            <QuizSlide title={item.slide_title} quiz={item.slide_data} />
          </View>
        );
      case 'ai':
        return (
          <View style={{ width: SCREEN_W, height: SCREEN_H }}>
            <AICourseChat title={item.slide_title} slideId={item.id} />
          </View>
        );
      case 'content':
        return (
          <View style={{ width: SCREEN_W, height: SCREEN_H }}>
            <ContentWithExample
              title={item.slide_title}
              mainPoint={item.slide_data?.mainPoint}
              tips={item.slide_data?.tips}
              example={item.slide_data?.example}
            />
          </View>
        );
      case 'dashboard':
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
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <MediaPlaceholder message={`Слайд типу "${item.slide_type}" ще не підтримується`} />
          </View>
        );
    }
  };

  if (!slides.length) return null;

  const safeInitial = Math.min(Math.max(0, initialIndex), slides.length - 1);

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderSlide}
        pagingEnabled
        horizontal={false}
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_H,
          offset: SCREEN_H * index,
          index,
        })}
        initialScrollIndex={safeInitial}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        snapToInterval={SCREEN_H}
        disableIntervalMomentum
        decelerationRate="fast"
        onScrollToIndexFailed={({ index }) => {
          flatListRef.current?.scrollToOffset({ offset: index * SCREEN_H, animated: false });
        }}
      />

      <View style={[styles.pagination, { top: SCREEN_H * 0.2, height: SCREEN_H * 0.6 }]}>
        {slides.map((_, i) => {
          const active = i === currentSlideIndex;
          return (
            <View
              key={String(i)}
              // pointerEvents="none"
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
  wrapper: { flex: 1, backgroundColor: '#fff' },
  pagination: {
    position: 'absolute',
    right: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginVertical: 6,
  },
  dotActive: { backgroundColor: '#000' },
  dotInactive: { backgroundColor: '#CFCFCF' },
});
