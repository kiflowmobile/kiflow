import { Module } from "react-native";

interface BaseSlide {
    id: number | string;
    slide_type: 'content' | 'video' | 'quiz' | 'ai' | 'completion' | 'text' | 'dashboard' ;
    slide_title?: string;
  }
  
  export interface TextSlide extends BaseSlide {
    slide_type: 'text';
    slide_title: string;
    slide_data: string;
  }

export interface VideoSlide extends BaseSlide {
  slide_type: 'video';
    video: {
      uri?: string | null;
      mux?: string | null;
    };
  }
  
  export interface ContentSlide extends BaseSlide {
    slide_type: 'content';
    slide_title: string;
    mainPoint: string;
    tips: string[];
    example: string;
  }
  
  export interface QuizSlide extends BaseSlide {
    slide_type: 'quiz';
    slide_title: string;
    quiz: {
      question: string;
      options: string[];
      correctAnswer: number;
    };
  }
  
  export interface AiSlide extends BaseSlide {
    slide_type: 'ai';
    slide_title: string;
    prompt: string;
  }
  
  export interface CompletionSlide extends BaseSlide {
    slide_type: 'completion';
    slide_title: string;
    subtitle: string;
    backgroundColor: string;
    completion: {
      message: string;
      stats: {
        label: string;
        value: string;
      }[];
    };
  }
  
  export interface DashboardSlide extends BaseSlide {
    slide_type: 'dashboard';
    slide_title: string;
    prompt: string;
  }


 type SlideVariations =
  | VideoSlide
  | ContentSlide
  | QuizSlide
  | AiSlide
  | CompletionSlide
  | DashboardSlide
  | TextSlide;

export interface Course {
  id: string;
  title: string;
  description?: string;
  instructor: string;
  image: string;
  is_public: boolean;
  code: string;
  contact_email: string;
  modules?: Module[]
}

export interface CourseSelectionProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  selectedCourseId?: string;
  onRefresh?: () => Promise<void>;
}