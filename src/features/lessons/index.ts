// Stores
export { useLessonsStore } from './store/lessonsStore';
export { useSlidesStore } from './store/slidesStore';

// Hooks
export { useLessons, useLesson, useLessonsByModule } from './hooks/useLessons';
export {
  useSlides,
  useSlideAnswers,
  useSlide,
  useSlideNavigation,
} from './hooks/useSlides';

// API
export { lessonsApi } from './api/lessonsApi';
export { slidesApi } from './api/slidesApi';

// Types
export type {
  Lesson,
  Slide,
  SlideType,
  TextSlide,
  VideoSlide,
  ContentSlide,
  QuizSlide,
  AiSlide,
  CompletionSlide,
  DashboardSlide,
  LessonsState,
  LessonsActions,
  LessonsStore,
  SlidesState,
  SlidesActions,
  SlidesStore,
} from './types';
