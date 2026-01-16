-- Migration: Schema Simplification Part 2
-- Description:
--   1. Remove users.full_name (redundant - derive from first_name + last_name)
--   2. Remove user_skill_ratings.course_id (redundant - derive from module_id)
--   3. Remove user_slide_interactions.module_id (redundant - derive from slide_id)
--   4. Fix user_skill_ratings constraints and defaults
--   5. Update handle_new_user trigger
-- Date: 2026-01-16
--
-- IMPORTANT: Run backup before executing this migration!
-- IMPORTANT: This migration requires app code changes

BEGIN;

-- ============================================================================
-- STEP 1: Remove users.full_name column
-- ============================================================================
-- full_name is redundant since we have first_name and last_name
-- App code already derives full_name from first_name + last_name

ALTER TABLE public.users DROP COLUMN IF EXISTS full_name;

-- ============================================================================
-- STEP 2: Update handle_new_user trigger to not use full_name
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.users (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$function$;

-- ============================================================================
-- STEP 3: Remove user_skill_ratings.course_id column
-- ============================================================================
-- course_id is redundant since module belongs to exactly one course
-- The unique constraint will be simplified

-- 3.1 Drop the old unique constraint that includes course_id
ALTER TABLE public.user_skill_ratings
  DROP CONSTRAINT IF EXISTS user_skill_ratings_unique_user_module_criteria_course;

-- Also try old name format
DROP INDEX IF EXISTS user_skill_ratings_unique_user_module_criteria_course;
DROP INDEX IF EXISTS unique_user_module_criteria_course;

-- 3.2 Drop the course_id index
DROP INDEX IF EXISTS idx_user_skill_ratings_course_id;

-- 3.3 Create new unique constraint without course_id
-- First check if it already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_skill_ratings_unique_user_module_criteria'
  ) THEN
    ALTER TABLE public.user_skill_ratings
      ADD CONSTRAINT user_skill_ratings_unique_user_module_criteria
      UNIQUE (user_id, module_id, criteria_key);
  END IF;
END $$;

-- 3.4 Drop the course_id column
ALTER TABLE public.user_skill_ratings DROP COLUMN IF EXISTS course_id;

-- ============================================================================
-- STEP 4: Remove user_slide_interactions.module_id column
-- ============================================================================
-- module_id is redundant since it can be derived from slide_id
-- (slide -> lesson -> module)
-- course_id is kept for query performance

-- 4.1 Drop the module_id foreign key constraint
ALTER TABLE public.user_slide_interactions
  DROP CONSTRAINT IF EXISTS user_slide_interactions_module_id_fkey;

-- 4.2 Drop the module_id column
ALTER TABLE public.user_slide_interactions DROP COLUMN IF EXISTS module_id;

-- ============================================================================
-- STEP 5: Fix user_skill_ratings defaults and add FK constraints
-- ============================================================================
-- The table has bad DEFAULT gen_random_uuid() on user_id and module_id
-- These should be NOT NULL without auto-generating random IDs

-- 5.1 Remove bad defaults
ALTER TABLE public.user_skill_ratings
  ALTER COLUMN user_id DROP DEFAULT;

ALTER TABLE public.user_skill_ratings
  ALTER COLUMN module_id DROP DEFAULT;

-- 5.2 Make columns NOT NULL (they should never be null)
ALTER TABLE public.user_skill_ratings
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.user_skill_ratings
  ALTER COLUMN module_id SET NOT NULL;

-- 5.3 Add foreign key constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_skill_ratings_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_skill_ratings
      ADD CONSTRAINT user_skill_ratings_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_skill_ratings_module_id_fkey'
  ) THEN
    ALTER TABLE public.user_skill_ratings
      ADD CONSTRAINT user_skill_ratings_module_id_fkey
      FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- Verification queries (run manually after migration)
-- ============================================================================

-- Check users table no longer has full_name:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public';

-- Check user_skill_ratings structure:
-- SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'user_skill_ratings' AND table_schema = 'public';

-- Check user_slide_interactions structure:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'user_slide_interactions' AND table_schema = 'public';

-- Check constraints on user_skill_ratings:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'public.user_skill_ratings'::regclass;
