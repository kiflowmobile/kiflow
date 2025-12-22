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
  lessonsId: string;
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
  lessonsId,
}) => {
  const { slides, isLoading, error } = useSlidesStore();
  const { modules, isLoading: isLoadingModules } = useModulesStore();
  const { lessons } = useLessonsStore();

  const slideData = useMemo(() => slides.find((s) => s.id === slideId), [slides, slideId]);
  const { moduleId, courseId } = useLocalSearchParams();
  const moduleIdStr = Array.isArray(moduleId) ? moduleId[0] : moduleId;
  const courseIdStr = Array.isArray(courseId) ? courseId[0] : courseId;

  // Вычисляем номер модуля с мемоизацией
  const moduleOrdinal = useMemo(() => {
    if (!slideData) return 1;
    
    // Если модули еще загружаются или их нет, возвращаем 1
    if (isLoadingModules || modules.length === 0) return 1;
    
    const moduleIdFromSlide = slideData.module_id;
    const targetModuleId = moduleIdStr || moduleIdFromSlide;
    
    // Фильтруем модули по курсу, если courseIdStr доступен
    const courseModules = courseIdStr
      ? modules.filter((m) => m.course_id === courseIdStr).sort((a, b) => {
          const orderA = Number(a.module_order) || 0;
          const orderB = Number(b.module_order) || 0;
          return orderA - orderB;
        })
      : modules.sort((a, b) => {
          const orderA = Number(a.module_order) || 0;
          const orderB = Number(b.module_order) || 0;
          return orderA - orderB;
        });
    
    const moduleObj = courseModules.find((m) => m.id === targetModuleId) || null;
    
    if (!moduleObj) {
      // Если модуль не найден, пытаемся найти его в общем массиве модулей
      const allModulesModule = modules.find((m) => m.id === targetModuleId);
      if (allModulesModule) {
        const orderNum = Number(allModulesModule.module_order);
        if (!isNaN(orderNum) && orderNum > 0) {
          return orderNum;
        }
      }
      return 1;
    }
    
    // Конвертируем module_order в число
    const moduleOrderNum = Number(moduleObj.module_order);
    
    // Используем module_order напрямую, если он валидный (число и больше 0)
    if (!isNaN(moduleOrderNum) && moduleOrderNum > 0) {
      return moduleOrderNum;
    }
    
    // Если module_order отсутствует или равен 0, используем позицию в отсортированном массиве модулей курса
    const index = courseModules.findIndex((m) => m.id === targetModuleId);
    return index >= 0 ? index + 1 : 1;
  }, [slideData, modules, courseIdStr, moduleIdStr, isLoadingModules]);

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
      const lessonIdFromSlide = (slideData as any).lesson_id;
      const lessonObj = lessonIdFromSlide
        ? lessons.find((l) => l.id === lessonIdFromSlide) || null
        : null;

      const lessonNumber = lessonObj ? lessonObj.lesson_order : slideData.slide_order ?? 1;

      const moduleLessons = lessons.filter((l) => l.module_id === slideData.module_id);
      const totalLessons = moduleLessons.length;

      return (
        <TextSlide
          title={slideData.slide_title}
          data={slideData.slide_data ?? ''}
          subtitle={`Module ${moduleOrdinal} / Lesson ${lessonNumber}${
            totalLessons > 0 ? ` of ${totalLessons}` : ''
          }`}
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
          lessonsId={lessonsId}
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
      const lessonIdFromDashboard = (slideData as any).lesson_id;
      const finalLessonId = lessonIdFromDashboard || lessonsId;
      // debug logs removed
      return (
        <DashboardSlide
          courseId={courseIdStr}
          title={slideData.slide_title}
          lessonId={finalLessonId}
          onComplete={onComplete}
        />
      );
    default:
      return (
        <MediaPlaceholder message={`Слайд типу "${slideData.slide_type}" ще не підтримується`} />
      );
  }
};

export default ModuleSlide;
