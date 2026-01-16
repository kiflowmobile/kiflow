-- Rollback: Schema Simplification
-- Run this to undo the schema simplification migration
-- WARNING: Data structure will change - quiz/chat data format will revert

BEGIN;

-- ============================================================================
-- STEP 1: Restore courses.code column
-- ============================================================================

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS code citext UNIQUE;

-- ============================================================================
-- STEP 2: Restore users.current_code column
-- ============================================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_code text;

-- ============================================================================
-- STEP 3: Recreate quiz_answers and chat_history from user_slide_interactions
-- ============================================================================

-- 3.1 Recreate quiz_answers table
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  user_id uuid NOT NULL,
  slide_id uuid NOT NULL,
  course_id uuid,
  module_id uuid,
  selected_answer smallint,
  correct_answer smallint,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_answers_pkey PRIMARY KEY (user_id, slide_id)
);

-- 3.2 Migrate quiz data back
INSERT INTO public.quiz_answers (user_id, slide_id, course_id, module_id, selected_answer, correct_answer, created_at)
SELECT
  usi.user_id,
  usi.slide_id,
  usi.course_id,
  usi.module_id,
  (usi.data->>'selected_answer')::smallint,
  (usi.data->>'correct_answer')::smallint,
  usi.created_at
FROM public.user_slide_interactions usi
WHERE usi.interaction_type = 'quiz'
ON CONFLICT (user_id, slide_id) DO NOTHING;

-- 3.3 Recreate chat_history table
CREATE TABLE IF NOT EXISTS public.chat_history (
  user_id uuid NOT NULL,
  course_id uuid,
  slide_id uuid NOT NULL,
  messages jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_history_pkey PRIMARY KEY (user_id, slide_id)
);

-- 3.4 Migrate chat data back
INSERT INTO public.chat_history (user_id, slide_id, course_id, messages, updated_at)
SELECT
  usi.user_id,
  usi.slide_id,
  usi.course_id,
  usi.data->'messages',
  usi.updated_at
FROM public.user_slide_interactions usi
WHERE usi.interaction_type = 'ai_chat'
ON CONFLICT (user_id, slide_id) DO NOTHING;

-- 3.5 Add foreign keys to restored tables
ALTER TABLE public.quiz_answers
  ADD CONSTRAINT quiz_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.chat_history
  ADD CONSTRAINT chat_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

-- 3.6 Drop the unified table
DROP TABLE IF EXISTS public.user_slide_interactions;

-- ============================================================================
-- STEP 4: Rename user_skill_ratings -> main_rating
-- ============================================================================

ALTER TABLE public.user_skill_ratings RENAME TO main_rating;

ALTER TABLE public.main_rating
  RENAME CONSTRAINT user_skill_ratings_pkey TO main_rating_pkey;

ALTER INDEX IF EXISTS user_skill_ratings_unique RENAME TO main_rating_unique;
ALTER INDEX IF EXISTS user_skill_ratings_unique_user_module_criteria_course RENAME TO main_rating_unique_user_module_criteria_course;
ALTER INDEX IF EXISTS user_skill_ratings_unique_user_module_criteria RENAME TO unique_user_module_criteria;
ALTER INDEX IF EXISTS idx_user_skill_ratings_user_id RENAME TO idx_main_rating_user_id;
ALTER INDEX IF EXISTS idx_user_skill_ratings_course_id RENAME TO idx_main_rating_course_id;
ALTER INDEX IF EXISTS idx_user_skill_ratings_module_id RENAME TO idx_main_rating_module_id;

ALTER POLICY "user_skill_ratings_select_own" ON public.main_rating RENAME TO "main_rating_select_self";
ALTER POLICY "user_skill_ratings_insert_own" ON public.main_rating RENAME TO "main_rating_insert_self";
ALTER POLICY "user_skill_ratings_update_own" ON public.main_rating RENAME TO "main_rating_update_self";

-- ============================================================================
-- STEP 5: Rename criteria -> criterias
-- ============================================================================

ALTER TABLE public.criteria RENAME TO criterias;

ALTER TABLE public.criterias
  RENAME CONSTRAINT criteria_pkey TO criterias_pkey;

ALTER TABLE public.criterias
  RENAME CONSTRAINT criteria_course_id_fkey TO criterias_course_id_fkey;

ALTER INDEX IF EXISTS idx_criteria_course_id RENAME TO idx_criterias_course_id;

COMMIT;
