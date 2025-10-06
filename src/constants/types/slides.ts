interface BaseSlide {
  id: string;
  module_id: string;
  slide_order: number;
  slide_type: SlideType;
  slide_title: string;
}

// ---- Різновиди слайдів ----
export interface TextSlide extends BaseSlide {
  slide_type: 'text';
  slide_data: {
    content: string;
  };
}

interface VideoMux {
  mux: string;
  uri: string;
}

interface videoSlideData {
  video: VideoMux
}

export interface VideoSlide extends BaseSlide {
  slide_type: 'video';
  slide_data: videoSlideData;
}

export interface ContentSlide extends BaseSlide {
  slide_type: 'content';
  slide_data: {
    mainPoint: string;
    tips: string[];
    example: string;
  };
}

export interface QuizSlide extends BaseSlide {
  slide_type: 'quiz';
  slide_data: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
}

export interface AiSlide extends BaseSlide {
  slide_type: 'ai';
  slide_data: {
    prompt: string;
  };
}

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

export interface DashboardSlide extends BaseSlide {
  slide_type: 'dashboard';
}


// ---- Об’єднаний тип ----
export type Slide =
  | TextSlide
  | VideoSlide
  | ContentSlide
  | QuizSlide
  | AiSlide
  | CompletionSlide
  | DashboardSlide;

// ---- Тип для всіх можливих значень slide_type ----
export type SlideType =
  | 'text'
  | 'video'
  | 'quiz'
  | 'content'
  | 'completion'
  | 'ai'
  | 'dashboard';
