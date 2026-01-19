-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  service_standards jsonb,
  code USER-DEFINED NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.company_courses (
  company_id uuid NOT NULL,
  course_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT company_courses_pkey PRIMARY KEY (company_id, course_id),
  CONSTRAINT fk_company_courses_company FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT fk_company_courses_course FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.company_members (
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  joined_via_code USER-DEFINED,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT company_members_pkey PRIMARY KEY (user_id, company_id),
  CONSTRAINT company_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT company_members_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image text,
  is_public boolean NOT NULL DEFAULT false,
  contact_email USER-DEFINED,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT courses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.criteria (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  course_id uuid NOT NULL,
  key text,
  name text,
  description text,
  CONSTRAINT criteria_pkey PRIMARY KEY (id),
  CONSTRAINT criteria_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  lesson_order integer NOT NULL DEFAULT 1,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT lessons_pkey PRIMARY KEY (id),
  CONSTRAINT fk_lessons_module FOREIGN KEY (module_id) REFERENCES public.modules(id)
);
CREATE TABLE public.modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  course_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  module_order numeric,
  CONSTRAINT modules_pkey PRIMARY KEY (id),
  CONSTRAINT fk_modules_course FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.slide_ai_prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slide_id uuid NOT NULL,
  system_instruction text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  initial_message text,
  CONSTRAINT slide_ai_prompts_pkey PRIMARY KEY (id),
  CONSTRAINT slide_ai_prompts_slide_id_fkey FOREIGN KEY (slide_id) REFERENCES public.slides(id)
);
CREATE TABLE public.slides (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slide_data jsonb NOT NULL,
  slide_order integer NOT NULL,
  slide_type text NOT NULL,
  slide_title text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  lesson_id uuid NOT NULL,
  CONSTRAINT slides_pkey PRIMARY KEY (id),
  CONSTRAINT fk_slides_lesson FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
);
CREATE TABLE public.user_criteria_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  rating real,
  user_id uuid NOT NULL,
  module_id uuid NOT NULL,
  criteria_id uuid,
  CONSTRAINT user_criteria_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT user_skill_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_skill_ratings_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id),
  CONSTRAINT user_criteria_ratings_criteria_id_fkey FOREIGN KEY (criteria_id) REFERENCES public.criteria(id)
);
CREATE TABLE public.user_module_progress (
  user_id uuid NOT NULL,
  module_id uuid NOT NULL,
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  last_slide_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_module_progress_pkey PRIMARY KEY (user_id, module_id),
  CONSTRAINT user_module_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_module_progress_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id),
  CONSTRAINT user_module_progress_last_slide_id_fkey FOREIGN KEY (last_slide_id) REFERENCES public.slides(id)
);
CREATE TABLE public.user_slide_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slide_id uuid NOT NULL,
  interaction_type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_slide_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT user_slide_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_slide_interactions_slide_id_fkey FOREIGN KEY (slide_id) REFERENCES public.slides(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  first_name text,
  last_name text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);