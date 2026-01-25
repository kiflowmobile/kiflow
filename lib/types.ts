export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  logo_url?: string;
  created_at: string;
}

export interface InviteCode {
  id: string;
  code: string;
  company_id: string;
  created_at: string;
}

export interface InviteCodeCourse {
  invite_code_id: string;
  course_id: string;
}

export interface UserCourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  from_invite_code_id?: string;
  enrolled_at: string;
}

export interface Course {
  id: string;
  company_id: string | null;
  title: string;
  image_url?: string;
  description?: string;
  is_public: boolean;
  created_at: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  order_index: number;
}

export interface Slide {
  id: string;
  lesson_id: string;
  type: "cover" | "content" | "video" | "quiz" | "case_study";
  content: Record<string, any>; // JSONB content
  order_index: number;
}

export interface AssessmentCriterion {
  id: string;
  course_id: string;
  title: string;
}

export interface CourseCaseStudyAIConfig {
  id: string;
  course_id: string;
  persona_name: string;
  system_role_instruction: string;
  created_at: string;
}

export interface CourseCaseStudyInteraction {
  id: string;
  user_id: string;
  slide_id: string;
  user_answer: string;
  ai_feedback?: string;
  created_at: string;
}

export interface CourseQuizInteraction {
  id: string;
  user_id: string;
  slide_id: string;
  selected_option_index: number;
  correct_option_index: number;
  created_at: string;
}

export interface CourseCaseStudyScore {
  id: string;
  interaction_id: string;
  criterion_id: string;
  score: number;
}

export interface CourseUserProgress {
  user_id: string;
  course_id: string;
  last_slide_id?: string;
  updated_at: string;
}

export interface UserLessonCriteriaScore {
  id: string;
  user_id: string;
  lesson_id: string;
  criterion_id: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface UserModuleCriteriaScore {
  id: string;
  user_id: string;
  module_id: string;
  criterion_id: string;
  score: number;
  updated_at: string;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: Partial<Company> & Pick<Company, "name">;
        Update: Partial<Company>;
      };
      courses: {
        Row: Course;
        Insert: Partial<Course> & Pick<Course, "title">;
        Update: Partial<Course>;
      };
      invite_codes: {
        Row: InviteCode;
        Insert: Partial<InviteCode> & Pick<InviteCode, "code" | "company_id">;
        Update: Partial<InviteCode>;
      };
      invite_code_courses: {
        Row: InviteCodeCourse;
        Insert: InviteCodeCourse;
        Update: Partial<InviteCodeCourse>;
      };
      user_course_enrollments: {
        Row: UserCourseEnrollment;
        Insert: Partial<UserCourseEnrollment> & Pick<UserCourseEnrollment, "user_id" | "course_id">;
        Update: Partial<UserCourseEnrollment>;
      };
      course_modules: {
        Row: Module;
        Insert: Partial<Module> & Pick<Module, "course_id" | "title" | "order_index">;
        Update: Partial<Module>;
      };
      course_lessons: {
        Row: Lesson;
        Insert: Partial<Lesson> & Pick<Lesson, "module_id" | "title" | "order_index">;
        Update: Partial<Lesson>;
      };
      course_slides: {
        Row: Slide;
        Insert: Partial<Slide> & Pick<Slide, "lesson_id" | "type" | "order_index">;
        Update: Partial<Slide>;
      };
      course_assessment_criteria: {
        Row: AssessmentCriterion;
        Insert: Partial<AssessmentCriterion> & Pick<AssessmentCriterion, "course_id" | "title">;
        Update: Partial<AssessmentCriterion>;
      };
      course_case_study_ai_configs: {
        Row: CourseCaseStudyAIConfig;
        Insert: Partial<CourseCaseStudyAIConfig> &
          Pick<CourseCaseStudyAIConfig, "course_id" | "persona_name" | "system_role_instruction">;
        Update: Partial<CourseCaseStudyAIConfig>;
      };
      course_case_study_interactions: {
        Row: CourseCaseStudyInteraction;
        Insert: Partial<CourseCaseStudyInteraction> &
          Pick<CourseCaseStudyInteraction, "user_id" | "slide_id" | "user_answer">;
        Update: Partial<CourseCaseStudyInteraction>;
      };
      course_quiz_interactions: {
        Row: CourseQuizInteraction;
        Insert: Partial<CourseQuizInteraction> &
          Pick<CourseQuizInteraction, "user_id" | "slide_id" | "selected_option_index" | "correct_option_index">;
        Update: Partial<CourseQuizInteraction>;
      };
      course_case_study_scores: {
        Row: CourseCaseStudyScore;
        Insert: Partial<CourseCaseStudyScore> & Pick<CourseCaseStudyScore, "interaction_id" | "criterion_id" | "score">;
        Update: Partial<CourseCaseStudyScore>;
      };
      course_user_progress: {
        Row: CourseUserProgress;
        Insert: Partial<CourseUserProgress> & Pick<CourseUserProgress, "user_id" | "course_id">;
        Update: Partial<CourseUserProgress>;
      };
    };
    Views: {
      view_user_lesson_grades: {
        Row: {
          user_id: string;
          course_id: string;
          module_id: string;
          lesson_id: string;
          quiz_avg_score: number;
          case_study_avg_score: number;
          lesson_grade: number;
        };
      };
      view_user_module_grades: {
        Row: {
          user_id: string;
          module_id: string;
          course_id: string;
          module_grade: number;
        };
      };
      view_user_course_grades: {
        Row: {
          user_id: string;
          course_id: string;
          course_grade: number;
        };
      };
    };
    Functions: {
      redeem_invite_code: {
        Args: { input_code: string };
        Returns: Course[];
      };
    };
  };
};
