-- Migration: Schema Simplification Part 3
-- Description:
--   1. Remove course_id from user_slide_interactions (derive from slide_id)
--   2. Add FK constraint for course_id in user_course_summaries
-- Date: 2026-01-16
--
-- IMPORTANT: Run backup before executing this migration!
-- IMPORTANT: This migration requires app code changes

BEGIN;

-- ============================================================================
-- STEP 1: Remove course_id from user_slide_interactions
-- ============================================================================
-- course_id is redundant since it can be derived from slide_id:
-- slide_id -> slides.lesson_id -> lessons.module_id -> modules.course_id

-- 1.1 Drop the course_id foreign key constraint
ALTER TABLE public.user_slide_interactions
  DROP CONSTRAINT IF EXISTS user_slide_interactions_course_id_fkey;

-- 1.2 Drop the course_id index
DROP INDEX IF EXISTS idx_user_slide_interactions_course_id;

-- 1.3 Drop the course_id column
ALTER TABLE public.user_slide_interactions DROP COLUMN IF EXISTS course_id;

-- ============================================================================
-- STEP 2: Add FK constraint for course_id in user_course_summaries
-- ============================================================================

-- 2.1 Delete orphaned records (course_id not in courses table)
DELETE FROM public.user_course_summaries
WHERE course_id IS NOT NULL
  AND course_id NOT IN (SELECT id FROM public.courses);

-- 2.2 Delete records with NULL course_id (invalid data)
DELETE FROM public.user_course_summaries
WHERE course_id IS NULL;

-- 2.3 Add NOT NULL constraint
ALTER TABLE public.user_course_summaries
  ALTER COLUMN course_id SET NOT NULL;

-- 2.4 Add FK constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_course_summaries_course_id_fkey'
  ) THEN
    ALTER TABLE public.user_course_summaries
      ADD CONSTRAINT user_course_summaries_course_id_fkey
      FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2.5 Also add user_id FK if missing
DELETE FROM public.user_course_summaries
WHERE user_id IS NOT NULL
  AND user_id NOT IN (SELECT id FROM public.users);

DELETE FROM public.user_course_summaries
WHERE user_id IS NULL;

ALTER TABLE public.user_course_summaries
  ALTER COLUMN user_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_course_summaries_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_course_summaries
      ADD CONSTRAINT user_course_summaries_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2.6 Add last_slide_id FK if missing
UPDATE public.user_course_summaries
SET last_slide_id = NULL
WHERE last_slide_id IS NOT NULL
  AND last_slide_id NOT IN (SELECT id FROM public.slides);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_course_summaries_last_slide_id_fkey'
  ) THEN
    ALTER TABLE public.user_course_summaries
      ADD CONSTRAINT user_course_summaries_last_slide_id_fkey
      FOREIGN KEY (last_slide_id) REFERENCES public.slides(id) ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- Verification queries (run manually after migration)
-- ============================================================================

-- Check user_slide_interactions no longer has course_id:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'user_slide_interactions' AND table_schema = 'public';

-- Check user_course_summaries constraints:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'public.user_course_summaries'::regclass;
