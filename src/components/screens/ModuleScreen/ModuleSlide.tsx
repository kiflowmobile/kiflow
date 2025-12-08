import React, { useMemo } from 'react';
import { Spinner, SPINNER_SIZES } from '../../ui/spinner';
import { Text, View } from 'react-native';
import TextSlide from './slides/TextSlide';
import QuizSlide from './slides/Quiz/QuizeSlide';
import AICourseChat from './slides/AICourseChat/AiCourseChat';
import ContentWithExample from './slides/ContentWithExample';
import DashboardSlide from './slides/DashboardSlide';
import MediaPlaceholder from './slides/MediaPlaceholder';
import { useSlidesStore, useModulesStore, useLessonsStore } from '@/src/stores';
import VideoPlayer from './VideoPlayer';
import { useLocalSearchParams } from 'expo-router';

interface CourseSlideProps {
  slideId: string | number;
  isActive: boolean;
  onComplete: () => void;
  currentIndex: number;
  totalSlides: number;
  setScrollEnabled?: (enabled: boolean) => void;
  isMuted?: boolean;
  toggleMute?: () => void;
}

const ModuleSlide: React.FC<CourseSlideProps> = ({
  slideId,
  isActive,
  onComplete,
  currentIndex,
  totalSlides,
  setScrollEnabled,
  isMuted,
  toggleMute,
}) => {
  const { slides, isLoading, error } = useSlidesStore();
  const { modules } = useModulesStore();
  const { lessons } = useLessonsStore();

  const slideData = useMemo(() => slides.find((s) => s.id === slideId), [slides, slideId]);
  const { moduleId, courseId } = useLocalSearchParams();
  const moduleIdStr = Array.isArray(moduleId) ? moduleId[0] : moduleId;
  const courseIdStr = Array.isArray(courseId) ? courseId[0] : courseId;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner size={SPINNER_SIZES.md} />
        <Text className="mt-2 text-center text-typography-600">Loading slide...</Text>
      </View>
    );
  }

  if (error || !slideData) {
    return <View className="flex-1 items-center justify-center"></View>;
  }

  switch (slideData.slide_type) {
    case 'text':
      const moduleIdFromSlide = slideData.module_id;
      const moduleObj = modules.find((m) => m.id === moduleIdFromSlide) || null;
      const moduleOrdinal = moduleObj
        ? moduleObj.module_order ?? modules.findIndex((m) => m.id === moduleIdFromSlide) + 1
        : (() => {
            const idx = modules.findIndex((m) => m.id === moduleIdFromSlide);
            return idx >= 0 ? idx + 1 : moduleIdStr ? Number(moduleIdStr) || 1 : 1;
          })();
      
      const lessonIdFromSlide = (slideData as any).lesson_id;
      const lessonObj = lessonIdFromSlide 
        ? lessons.find((l) => l.id === lessonIdFromSlide) || null
        : null;
      
      const lessonNumber = lessonObj 
        ? lessonObj.lesson_order 
        : slideData.slide_order ?? 1;
      
      const moduleLessons = lessons.filter((l) => l.module_id === moduleIdFromSlide);
      const totalLessons = moduleLessons.length;
      
      return (
        <TextSlide
          title={slideData.slide_title}
          data={slideData.slide_data ?? ''}
          subtitle={`Module ${moduleOrdinal} / Lesson ${lessonNumber}${totalLessons > 0 ? ` of ${totalLessons}` : ''}`}
        />
      );
    case 'video': {
      const { uri, mux } = slideData.slide_data?.video || {};
      const hasVideo = !!uri || !!mux;
      return (
        <>
          {isActive &&
            (hasVideo ? (
              <VideoPlayer 
                uri={uri ?? undefined} 
                mux={mux ?? undefined} 
                isActive={isActive}
                isMuted={isMuted}
                toggleMute={toggleMute}
              />
            ) : (
              <MediaPlaceholder />
            ))}
        </>
      );
    }
    case 'quiz':
      return (
        <QuizSlide
          id={slideData.id}
          courseId={courseIdStr}
          title={slideData.slide_title}
          quiz={slideData.slide_data}
          onComplete={onComplete}
          isActive={isActive}
          setScrollEnabled={setScrollEnabled}
        />
      );
    case 'ai':
      return (
        <AICourseChat
          title={slideData.slide_title}
          slideId={slideData.id}
          setScrollEnabled={setScrollEnabled}
          isActive={isActive}
          onComplete={onComplete}
        />
      );
    case 'content':
      return (
        <ContentWithExample
          title={slideData.slide_title}
          mainPoint={slideData.slide_data?.mainPoint}
          tips={slideData.slide_data?.tips}
          example={slideData.slide_data?.example}
        />
      );
    case 'dashboard':
      return <DashboardSlide courseId={courseIdStr} title={slideData.slide_title} />;
    default:
      return (
        <MediaPlaceholder message={`Слайд типу "${slideData.slide_type}" ще не підтримується`} />
      );
  }
};

export default ModuleSlide;