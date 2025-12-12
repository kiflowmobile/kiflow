import React, { useMemo } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Slide } from '@/src/constants/types/slides';
import { Lessons } from '@/src/constants/types/lesson';
import { Colors } from '@/src/constants/Colors';
import CloseSvg from '@/src/assets/images/close.svg';
import { useRouter } from 'expo-router';
import VolumeOnSvg from '@/src/assets/images/volume-on.svg';
import VolumeOffSvg from '@/src/assets/images/volume-off.svg';

interface LessonProgressBarsProps {
  slides: Slide[];
  lessons: Lessons[];
  currentSlideId?: string;
  currentSlideIndex?: number;
  courseId?: string;
  isMuted?: boolean;
  toggleMute?: () => void;
}

function LessonProgressBars({
  slides,
  lessons,
  currentSlideId,
  currentSlideIndex = 0,
  courseId,
  isMuted,
  toggleMute,
}: LessonProgressBarsProps) {
  const router = useRouter();

  const handleClose = () => {
    if (courseId) {
      router.push({ pathname: '/courses/[id]', params: { id: courseId } });
    } else {
      router.back();
    }
  };

  const currentLessonData = useMemo(() => {
    const slidesByLesson = new Map<string, Slide[]>();
    slides.forEach((s) => {
      const lessonId = (s as any).lesson_id;
      if (!lessonId) return;
      if (!slidesByLesson.has(lessonId)) slidesByLesson.set(lessonId, []);
      slidesByLesson.get(lessonId)!.push(s);
    });

    const sortedLessons = [...lessons].sort((a, b) => a.lesson_order - b.lesson_order);

    const currentSlide = slides[currentSlideIndex] || slides.find((s) => s.id === currentSlideId);
    const currentLessonId = currentSlide
      ? (currentSlide as any).lesson_id
      : (sortedLessons[0] && sortedLessons[0].id) || null;

    if (!currentLessonId) return null;

    const lesson = sortedLessons.find((l) => l.id === currentLessonId) || sortedLessons[0];
    const lessonSlides = slidesByLesson.get(lesson.id) || [];
    const sortedLessonSlides = [...lessonSlides].sort((a, b) => a.slide_order - b.slide_order);

    const currentIndexInLesson = sortedLessonSlides.findIndex(
      (s) => s.id === (currentSlide?.id || currentSlideId),
    );

    const slideStates = sortedLessonSlides.map((s, idx) => {
      if (currentIndexInLesson === -1) return { slide: s, status: 'empty' };
      if (idx < currentIndexInLesson) return { slide: s, status: 'done' };
      if (idx === currentIndexInLesson) return { slide: s, status: 'current' };
      return { slide: s, status: 'empty' };
    });

    return {
      lesson,
      slideStates,
      total: sortedLessonSlides.length,
      currentIndexInLesson,
    };
  }, [slides, lessons, currentSlideId, currentSlideIndex]);

  if (!currentLessonData) return null;
  const currentSlideType =
    (slides && slides[currentSlideIndex] && (slides[currentSlideIndex] as any).slide_type) || null;

  // Treat certain slide types as intro/transparent screens for styling (transparent background, white close icon)
  const isTransparentScreen =
    currentSlideType === 'video' || currentSlideType === 'text' || currentSlideType === 'dashboard';

  return (
    <View style={[styles.root, isTransparentScreen && styles.rootTransparent]}>
      <View style={styles.leftRow}>
        <Pressable onPress={handleClose} >
          <CloseSvg width={24} height={24} color={isTransparentScreen ? '#FFFFFF' : Colors.black} />
        </Pressable>
      </View>

      {currentSlideType !== 'text' && currentSlideType !== 'dashboard' && (
        <View style={styles.centerRow}>
          <View style={styles.scrollRow}>
            <View style={[styles.lessonGroup, styles.lessonCurrentGroup]}>
              {currentLessonData.slideStates
                .filter((_: any, idx: number) => idx > 0)
                .map((s: any, idx: number, filteredArray: any[]) => {
                  const isVideo = currentSlideType === 'video';
                  return (
                    <View
                      key={s.slide.id || `${currentLessonData.lesson.id}-${idx + 1}`}
                      style={[
                        styles.segment,
                        { flex: 1 },
                        isVideo && styles.segmentVideo,
                        s.status === 'done' &&
                          (isVideo ? styles.segmentDoneVideo : styles.segmentDone),
                        s.status === 'current' &&
                          (isVideo ? styles.segmentCurrentVideo : styles.segmentCurrent),
                      ]}
                    />
                  );
                })}
            </View>
          </View>
        </View>
      )}

      <View style={styles.rightRow}>
        {currentSlideType === 'video' && toggleMute && (
          <Pressable
            onPress={toggleMute}
            style={styles.muteButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isMuted ? (
              <VolumeOffSvg
                width={24}
                height={24}
                color={isTransparentScreen ? '#FFFFFF' : Colors.black}
              />
            ) : (
              <VolumeOnSvg
                width={24}
                height={24}
                color={isTransparentScreen ? '#FFFFFF' : Colors.black}
              />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default LessonProgressBars;

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    zIndex: 1000,
    backgroundColor: Colors.bg,
  },
  rootTransparent: {
    backgroundColor: 'transparent',
  },
  leftRow: { width: 48, alignItems: 'center', justifyContent: 'center' },
  centerRow: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  rightRow: { width: 48, alignItems: 'center', justifyContent: 'center' },
  scrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 0,
    width: '100%',
  },
  lessonGroup: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 6,
    borderRadius: 8,
    flex: 1,
  },
  lessonCurrentGroup: {},
  muteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteText: { fontSize: 18 },
  segment: {
    height: 4,
    borderRadius: 4,
    backgroundColor: Colors.black,
    opacity: 0.1,
    alignSelf: 'center',
    minWidth: 4,
  },
  segmentVideo: {
    backgroundColor: '#FFFFFF',
    opacity: 0.1,
  },
  segmentDone: {
    backgroundColor: Colors.black,
    opacity: 1,
  },
  segmentDoneVideo: {
    backgroundColor: '#FFFFFF',
    opacity: 1,
  },
  segmentCurrent: {
    backgroundColor: Colors.black,
    opacity: 1,
  },
  segmentCurrentVideo: {
    backgroundColor: '#FFFFFF',
    opacity: 1,
  },
});
