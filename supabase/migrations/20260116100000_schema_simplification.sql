-- Migration: Schema Simplification
-- Description:
--   1. Remove courses.code
--   2. Remove users.current_code
--   3. Merge quiz_answers + chat_history -> user_slide_interactions
--   4. Rename main_rating -> user_skill_ratings
--   5. Rename criterias -> criteria
-- Date: 2026-01-16
--
-- IMPORTANT: Run backup before executing this migration!
-- IMPORTANT: This migration requires app code changes - see APP_CODE_CHANGES.md

BEGIN;

-- ============================================================================
-- STEP 1: Remove courses.code column
-- ============================================================================

ALTER TABLE public.courses DROP COLUMN IF EXISTS code;

-- ============================================================================
-- STEP 2: Remove users.current_code column
-- ============================================================================

ALTER TABLE public.users DROP COLUMN IF EXISTS current_code;

-- ============================================================================
-- STEP 3: Create new user_slide_interactions table and migrate data
-- ============================================================================

-- 3.1 Create the new unified table
CREATE TABLE public.user_slide_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slide_id uuid NOT NULL,
  course_id uuid,
  module_id uuid,
  interaction_type text NOT NULL,  -- 'quiz', 'ai_chat'
  data jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_slide_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT user_slide_interactions_unique UNIQUE (user_id, slide_id, interaction_type),
  CONSTRAINT user_slide_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT user_slide_interactions_slide_id_fkey FOREIGN KEY (slide_id) REFERENCES public.slides(id) ON DELETE CASCADE,
  CONSTRAINT user_slide_interactions_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL,
  CONSTRAINT user_slide_interactions_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE SET NULL
);

-- 3.2 Create indexes for performance
CREATE INDEX idx_user_slide_interactions_user_id ON public.user_slide_interactions(user_id);
CREATE INDEX idx_user_slide_interactions_slide_id ON public.user_slide_interactions(slide_id);
CREATE INDEX idx_user_slide_interactions_course_id ON public.user_slide_interactions(course_id);
CREATE INDEX idx_user_slide_interactions_type ON public.user_slide_interactions(interaction_type);
CREATE INDEX idx_user_slide_interactions_user_slide ON public.user_slide_interactions(user_id, slide_id);

-- 3.3 Enable RLS
ALTER TABLE public.user_slide_interactions ENABLE ROW LEVEL SECURITY;

-- 3.4 Create RLS policies
CREATE POLICY "user_slide_interactions_select_own"
  ON public.user_slide_interactions
  AS permissive
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_slide_interactions_insert_own"
  ON public.user_slide_interactions
  AS permissive
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_slide_interactions_update_own"
  ON public.user_slide_interactions
  AS permissive
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_slide_interactions_delete_own"
  ON public.user_slide_interactions
  AS permissive
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3.5 Migrate data from quiz_answers
-- Note: module_id is set to NULL if the module doesn't exist (orphaned data)
INSERT INTO public.user_slide_interactions (user_id, slide_id, course_id, module_id, interaction_type, data, created_at)
SELECT
  qa.user_id,
  qa.slide_id,
  CASE WHEN EXISTS (SELECT 1 FROM public.courses c WHERE c.id = qa.course_id) THEN qa.course_id ELSE NULL END,
  CASE WHEN EXISTS (SELECT 1 FROM public.modules m WHERE m.id = qa.module_id) THEN qa.module_id ELSE NULL END,
  'quiz' as interaction_type,
  jsonb_build_object(
    'selected_answer', qa.selected_answer,
    'correct_answer', qa.correct_answer
  ) as data,
  COALESCE(qa.created_at, now()) as created_at
FROM public.quiz_answers qa
WHERE EXISTS (SELECT 1 FROM public.users u WHERE u.id = qa.user_id)
  AND EXISTS (SELECT 1 FROM public.slides s WHERE s.id = qa.slide_id)
ON CONFLICT (user_id, slide_id, interaction_type) DO NOTHING;

-- 3.6 Migrate data from chat_history
INSERT INTO public.user_slide_interactions (user_id, slide_id, course_id, module_id, interaction_type, data, created_at, updated_at)
SELECT
  ch.user_id,
  ch.slide_id,
  CASE WHEN EXISTS (SELECT 1 FROM public.courses c WHERE c.id = ch.course_id) THEN ch.course_id ELSE NULL END,
  NULL as module_id,  -- chat_history doesn't have module_id
  'ai_chat' as interaction_type,
  jsonb_build_object('messages', COALESCE(ch.messages, '[]'::jsonb)) as data,
  COALESCE(ch.updated_at, now()) as created_at,
  ch.updated_at
FROM public.chat_history ch
WHERE EXISTS (SELECT 1 FROM public.users u WHERE u.id = ch.user_id)
  AND EXISTS (SELECT 1 FROM public.slides s WHERE s.id = ch.slide_id)
ON CONFLICT (user_id, slide_id, interaction_type) DO NOTHING;

-- 3.7 Drop old tables (after data migration)
DROP TABLE IF EXISTS public.quiz_answers;
DROP TABLE IF EXISTS public.chat_history;

-- ============================================================================
-- STEP 4: Rename main_rating -> user_skill_ratings
-- ============================================================================

-- 4.1 Rename the table
ALTER TABLE public.main_rating RENAME TO user_skill_ratings;

-- 4.2 Rename constraints
ALTER TABLE public.user_skill_ratings
  RENAME CONSTRAINT main_rating_pkey TO user_skill_ratings_pkey;

-- Rename indexes (if they exist)
ALTER INDEX IF EXISTS main_rating_unique RENAME TO user_skill_ratings_unique;
ALTER INDEX IF EXISTS main_rating_unique_user_module_criteria_course RENAME TO user_skill_ratings_unique_user_module_criteria_course;
ALTER INDEX IF EXISTS unique_user_module_criteria RENAME TO user_skill_ratings_unique_user_module_criteria;
ALTER INDEX IF EXISTS idx_main_rating_user_id RENAME TO idx_user_skill_ratings_user_id;
ALTER INDEX IF EXISTS idx_main_rating_course_id RENAME TO idx_user_skill_ratings_course_id;
ALTER INDEX IF EXISTS idx_main_rating_module_id RENAME TO idx_user_skill_ratings_module_id;

-- 4.3 Rename RLS policies
ALTER POLICY "main_rating_select_self" ON public.user_skill_ratings RENAME TO "user_skill_ratings_select_own";
ALTER POLICY "main_rating_insert_self" ON public.user_skill_ratings RENAME TO "user_skill_ratings_insert_own";
ALTER POLICY "main_rating_update_self" ON public.user_skill_ratings RENAME TO "user_skill_ratings_update_own";

-- ============================================================================
-- STEP 5: Rename criterias -> criteria
-- ============================================================================

-- 5.1 Rename the table
ALTER TABLE public.criterias RENAME TO criteria;

-- 5.2 Rename constraints
ALTER TABLE public.criteria
  RENAME CONSTRAINT criterias_pkey TO criteria_pkey;

ALTER TABLE public.criteria
  RENAME CONSTRAINT criterias_course_id_fkey TO criteria_course_id_fkey;

-- Rename indexes
ALTER INDEX IF EXISTS idx_criterias_course_id RENAME TO idx_criteria_course_id;

-- ============================================================================
-- STEP 6: Grant permissions on new table
-- ============================================================================

GRANT ALL ON public.user_slide_interactions TO anon;
GRANT ALL ON public.user_slide_interactions TO authenticated;
GRANT ALL ON public.user_slide_interactions TO service_role;

COMMIT;

-- ============================================================================
-- Verification queries (run manually after migration)
-- ============================================================================

-- Check data migration:
-- SELECT interaction_type, COUNT(*) FROM public.user_slide_interactions GROUP BY interaction_type;

-- Check renamed tables exist:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('user_skill_ratings', 'criteria', 'user_slide_interactions');

-- Check old tables are gone:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('main_rating', 'criterias', 'quiz_answers', 'chat_history');
