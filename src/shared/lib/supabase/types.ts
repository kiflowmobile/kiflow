// Database types generated from schema.sql
// These types match the Supabase database schema

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          service_standards: Record<string, unknown> | null;
          code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          service_standards?: Record<string, unknown> | null;
          code: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          service_standards?: Record<string, unknown> | null;
          code?: string;
          created_at?: string;
        };
      };
      company_courses: {
        Row: {
          company_id: string;
          course_id: string;
          created_at: string;
        };
        Insert: {
          company_id: string;
          course_id: string;
          created_at?: string;
        };
        Update: {
          company_id?: string;
          course_id?: string;
          created_at?: string;
        };
      };
      company_members: {
        Row: {
          user_id: string;
          company_id: string;
          joined_via_code: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          company_id: string;
          joined_via_code?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          company_id?: string;
          joined_via_code?: string | null;
          created_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          image: string | null;
          is_public: boolean;
          contact_email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          image?: string | null;
          is_public?: boolean;
          contact_email?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          image?: string | null;
          is_public?: boolean;
          contact_email?: string | null;
          created_at?: string;
        };
      };
      criteria: {
        Row: {
          id: string;
          created_at: string;
          course_id: string;
          key: string | null;
          name: string | null;
          description: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          course_id: string;
          key?: string | null;
          name?: string | null;
          description?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          course_id?: string;
          key?: string | null;
          name?: string | null;
          description?: string | null;
        };
      };
      lessons: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          description: string | null;
          lesson_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          title: string;
          description?: string | null;
          lesson_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          module_id?: string;
          title?: string;
          description?: string | null;
          lesson_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      modules: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          course_id: string;
          created_at: string;
          module_order: number | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          course_id: string;
          created_at?: string;
          module_order?: number | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          course_id?: string;
          created_at?: string;
          module_order?: number | null;
        };
      };
      slide_ai_prompts: {
        Row: {
          id: string;
          slide_id: string;
          system_instruction: string;
          created_at: string;
          updated_at: string;
          initial_message: string | null;
        };
        Insert: {
          id?: string;
          slide_id: string;
          system_instruction: string;
          created_at?: string;
          updated_at?: string;
          initial_message?: string | null;
        };
        Update: {
          id?: string;
          slide_id?: string;
          system_instruction?: string;
          created_at?: string;
          updated_at?: string;
          initial_message?: string | null;
        };
      };
      slides: {
        Row: {
          id: string;
          slide_data: Record<string, unknown>;
          slide_order: number;
          slide_type: string;
          slide_title: string | null;
          created_at: string;
          updated_at: string;
          lesson_id: string;
        };
        Insert: {
          id?: string;
          slide_data: Record<string, unknown>;
          slide_order: number;
          slide_type: string;
          slide_title?: string | null;
          created_at?: string;
          updated_at?: string;
          lesson_id: string;
        };
        Update: {
          id?: string;
          slide_data?: Record<string, unknown>;
          slide_order?: number;
          slide_type?: string;
          slide_title?: string | null;
          created_at?: string;
          updated_at?: string;
          lesson_id?: string;
        };
      };
      user_criteria_ratings: {
        Row: {
          id: string;
          created_at: string;
          rating: number | null;
          user_id: string;
          module_id: string;
          criteria_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          rating?: number | null;
          user_id: string;
          module_id: string;
          criteria_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          rating?: number | null;
          user_id?: string;
          module_id?: string;
          criteria_id?: string | null;
        };
      };
      user_module_progress: {
        Row: {
          user_id: string;
          module_id: string;
          progress: number;
          last_slide_id: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          module_id: string;
          progress?: number;
          last_slide_id?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          module_id?: string;
          progress?: number;
          last_slide_id?: string | null;
          updated_at?: string;
        };
      };
      user_slide_interactions: {
        Row: {
          id: string;
          user_id: string;
          slide_id: string;
          interaction_type: string;
          data: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          slide_id: string;
          interaction_type: string;
          data?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          slide_id?: string;
          interaction_type?: string;
          data?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
          first_name: string | null;
          last_name: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          first_name?: string | null;
          last_name?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          first_name?: string | null;
          last_name?: string | null;
        };
      };
    };
  };
}

// Helper types for common use cases
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Convenience type aliases
export type Company = Tables<'companies'>;
export type Course = Tables<'courses'>;
export type Module = Tables<'modules'>;
export type Lesson = Tables<'lessons'>;
export type Slide = Tables<'slides'>;
export type SlideAiPrompt = Tables<'slide_ai_prompts'>;
export type User = Tables<'users'>;
export type CompanyMember = Tables<'company_members'>;
export type CompanyCourse = Tables<'company_courses'>;
export type Criteria = Tables<'criteria'>;
export type UserCriteriaRating = Tables<'user_criteria_ratings'>;
export type UserModuleProgress = Tables<'user_module_progress'>;
export type UserSlideInteraction = Tables<'user_slide_interactions'>;
