import { View } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { Spinner, SPINNER_SIZES } from '../../ui/spinner';
import { Text, useWindowDimensions } from 'react-native';
import TextSlide from './slides/TextSlide';
import QuizSlide from './slides/QuizeSlide';
import AICourseChat from './slides/AICourseChat/AiCourseChat';
import ContentWithExample from './slides/ContentWithExample';
import DashboardSlide from './slides/DashboardSlide';
import MediaPlaceholder from './slides/MediaPlaceholder';
import { useSlidesStore } from '@/src/stores';
import VideoPlayer from './VideoPlayer';



interface CourseSlideProps {
  slideId: string | number;
  isActive: boolean;
  onComplete: () => void;
  currentIndex: number;
  totalSlides: number;
}


const ModuleSlide: React.FC<CourseSlideProps> = ({
  slideId,
  isActive,
  onComplete,
  currentIndex,
  totalSlides,
}) => {
  const { slides, isLoading, error } = useSlidesStore();

  const { height: SCREEN_H, width: SCREEN_W } = useWindowDimensions();

  const slideData = useMemo(
    () => slides.find((s) => s.id === slideId),
    [slides, slideId]
  );

  if (isLoading) {
    return (
      <View className='flex-1 items-center justify-center'>
        <Spinner size={SPINNER_SIZES.md} />
        <Text className='mt-2 text-center text-typography-600'>Loading slide...</Text>
      </View>
    );
  }

  if (error || !slideData) {
    return (
      <View className='flex-1 items-center justify-center'>
        {/* <Text className='text-danger-600'>{error?.message || 'Slide data is missing'}</Text> */}
      </View>
    );
  }

  // useEffect(() => {
  //   if (!isActive && videoRef.current) {
  //     videoRef.current.pause();
  //   }
  // }, [isActive]);

  switch (slideData.slide_type) {
    case 'text':
      return (
           <TextSlide title={slideData.slide_title} data={slideData.slide_data ?? ''} /> 
 
      );
    case 'video': {
      const { uri, mux } = slideData.slide_data?.video || {};
      const hasVideo = !!uri || !!mux;
      return (
        <>
          {isActive && (
            hasVideo ? (
              <VideoPlayer uri={uri ?? undefined} mux={mux ?? undefined} isActive={isActive} />
            ) : (
              <MediaPlaceholder />
            )
          )}
        </>
      );
    }
    case 'quiz':
      return (
          <QuizSlide title={slideData.slide_title} quiz={slideData.slide_data} />
      );
    case 'ai':
      return (
          <AICourseChat title={slideData.slide_title} slideId={slideData.id} />
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
      return (
          <DashboardSlide title={slideData.slide_title} />
    
      );
    default:
      return (
        // <View
        //   style={{
        //     width: SCREEN_W,
        //     height: SCREEN_H,
        //     justifyContent: 'center',
        //     alignItems: 'center',
        //   }}
        // >
          <MediaPlaceholder message={`Слайд типу "${slideData.slide_type}" ще не підтримується`} />
        // </View>
      );
  }
};

export default ModuleSlide;