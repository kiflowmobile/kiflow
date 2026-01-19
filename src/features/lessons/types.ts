// Lesson types
export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  lesson_order: number;
  created_at: string;
  updated_at: string | null;
}

// Base slide interface
interface BaseSlide {
  id: string;
  lesson_id: string;
  module_id: string;
  slide_order: number;
  slide_type: SlideType;
  slide_title: string;
}

// Text slide
export interface TextSlide extends BaseSlide {
  slide_type: 'text';
  slide_data: {
    content: string;
  };
}

// Video slide
interface VideoMux {
  mux: string;
  uri: string;
}

interface VideoSlideData {
  video: VideoMux;
}

export interface VideoSlide extends BaseSlide {
  slide_type: 'video';
  slide_data: VideoSlideData;
}

// Content slide
export interface ContentSlide extends BaseSlide {
  slide_type: 'content';
  slide_data: {
    mainPoint: string;
    tips: string[];
    example: string;
  };
}

// Quiz slide
export interface QuizSlide extends BaseSlide {
  slide_type: 'quiz';
  slide_data: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
}

// AI slide
export interface AiSlide extends BaseSlide {
  slide_type: 'ai';
  slide_data: {
    prompt: string;
  };
}

// Completion slide
export interface CompletionSlide extends BaseSlide {
  slide_type: 'completion';
  slide_data: {
    subtitle: string;
    backgroundColor: string;
    message: string;
    stats: {
      label: string;
      value: string;
    }[];
  };
}

// Dashboard slide
export interface DashboardSlide extends BaseSlide {
  slide_type: 'dashboard';
  slide_data?: Record<string, unknown>;
}

// Union type for all slides
export type Slide =
  | TextSlide
  | VideoSlide
  | ContentSlide
  | QuizSlide
  | AiSlide
  | CompletionSlide
  | DashboardSlide;

// Slide type enum
export type SlideType = 'text' | 'video' | 'quiz' | 'content' | 'completion' | 'ai' | 'dashboard';

// Store state types
export interface LessonsState {
  lessons: Lesson[];
  isLoading: boolean;
  error: string | null;
}

export interface LessonsActions {
  fetchLessonsByModule: (moduleId: string) => Promise<void>;
  setLessons: (lessons: Lesson[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  clearLessons: () => void;
}

export type LessonsStore = LessonsState & LessonsActions;

export interface SlidesState {
  slides: Slide[];
  currentSlideIndex: number;
  currentModuleId: string | null;
  isLoading: boolean;
  error: string | null;
  answeredBySlideId: Record<string, boolean>;
}

export interface SlidesActions {
  fetchSlidesByLessons: (lessons: Lesson[]) => Promise<void>;
  setCurrentSlideIndex: (index: number) => void;
  nextSlide: () => void;
  previousSlide: () => void;
  setSlides: (slides: Slide[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentModuleId: (moduleId: string | null) => void;
  getCurrentSlideId: () => string | null;
  isSlideAnswered: (slideId: string) => boolean;
  markSlideAnswered: (slideId: string) => void;
  clearAnsweredSlides: () => void;
  clearError: () => void;
  clearSlides: () => void;
}

export type SlidesStore = SlidesState & SlidesActions;
