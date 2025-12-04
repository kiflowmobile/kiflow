import React, { useMemo, useState, useEffect } from 'react';
import { Spinner, SPINNER_SIZES } from '../../ui/spinner';
import { Text, View } from 'react-native';
import TextSlide from './slides/TextSlide';
import QuizSlide from './slides/Quiz/QuizeSlide';
import AICourseChat from './slides/AICourseChat/AiCourseChat';
import ContentWithExample from './slides/ContentWithExample';
import DashboardSlide from './slides/DashboardSlide';
import MediaPlaceholder from './slides/MediaPlaceholder';
import { useSlidesStore, useModulesStore } from '@/src/stores';
import { getLessonOrderBySlideId } from '@/src/services/lessons';
import VideoPlayer from './VideoPlayer';
import { useLocalSearchParams } from 'expo-router';

interface CourseSlideProps {
  slideId: string | number;
  isActive: boolean;
  onComplete: () => void;
  currentIndex: number;
  totalSlides: number;
  setScrollEnabled?: (enabled: boolean) => void;
}

const ModuleSlide: React.FC<CourseSlideProps> = ({
  slideId,
  isActive,
  onComplete,
  currentIndex,
  totalSlides,
  setScrollEnabled,
}) => {
  const { slides, isLoading, error } = useSlidesStore();
  const { modules } = useModulesStore();

  const slideData = useMemo(() => slides.find((s) => s.id === slideId), [slides, slideId]);
  const { moduleId, courseId } = useLocalSearchParams();
  const moduleIdStr = Array.isArray(moduleId) ? moduleId[0] : moduleId;
  const courseIdStr = Array.isArray(courseId) ? courseId[0] : courseId;

  // попытка получить номер урока (lesson_order) из БД по id слайда
  const [lessonNumberFromDb, setLessonNumberFromDb] = useState<number | null>(null);
  useEffect(() => {
    let mounted = true;
    const fetchLessonNumber = async () => {
      if (!slideData?.id) {
        setLessonNumberFromDb(null);
        return;
      }

      try {
        const res = await getLessonOrderBySlideId(String(slideData.id));
        if (!mounted) return;
        if (!res.error && res.data && res.data.lesson_order != null) {
          setLessonNumberFromDb(res.data.lesson_order);
        } else {
          setLessonNumberFromDb(null);
        }
      } catch {
        setLessonNumberFromDb(null);
      }
    };

    fetchLessonNumber();
    return () => {
      mounted = false;
    };
  }, [slideData?.id]);

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
    case 'text': {
      const moduleIdFromSlide = slideData.module_id;
      const moduleIndex = modules.findIndex((m) => m.id === moduleIdFromSlide);
      const moduleObj = modules[moduleIndex];
      const moduleOrdinal =
        moduleObj?.module_order ?? (moduleIndex >= 0 ? moduleIndex + 1 : Number(moduleIdStr) || 1);

      const lessonNumber = lessonNumberFromDb ?? slideData.slide_order ?? 1;

      return (
        <TextSlide
          title={slideData.slide_title}
          data={slideData.slide_data ?? ''}
          subtitle={`Module ${moduleOrdinal} / Lesson ${lessonNumber}`}
        />
      );
    }
    case 'video': {
      const { uri, mux } = slideData.slide_data?.video || {};
      const hasVideo = !!uri || !!mux;
      return (
        <>
          {isActive &&
            (hasVideo ? (
              <VideoPlayer uri={uri ?? undefined} mux={mux ?? undefined} isActive={isActive} />
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
      return <AICourseChat title={slideData.slide_title} slideId={slideData.id} />;
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
