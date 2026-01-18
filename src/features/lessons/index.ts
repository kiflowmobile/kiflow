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

// Types - note: individual slide types (TextSlide, QuizSlide, etc.) are not exported to avoid
// conflicts with component names. Use the `Slide` union type instead.
export type {
  Lesson,
  Slide,
  SlideType,
  VideoSlide,
  ContentSlide,
  AiSlide,
  CompletionSlide,
  LessonsState,
  LessonsActions,
  LessonsStore,
  SlidesState,
  SlidesActions,
  SlidesStore,
} from './types';

// Slide type interfaces (renamed to avoid component name conflicts)
export type { TextSlide as TextSlideType, QuizSlide as QuizSlideType, DashboardSlide as DashboardSlideType } from './types';

// Components
export { LessonSlide } from './components/lesson';
export { TextSlide } from './components/text-slide';
export { ExampleSlide } from './components/example-slide';
export { DashboardSlide } from './components/dashboard-slide';
export { MediaPlaceholder } from './components/media-placeholder';