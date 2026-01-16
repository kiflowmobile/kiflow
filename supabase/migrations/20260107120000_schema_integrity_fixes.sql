-- Migration: Schema Integrity Fixes
-- Description: Adds missing foreign keys, fixes defaults, adds indexes, improves data integrity
-- Date: 2026-01-07
--
-- IMPORTANT: Run backup before executing this migration!
-- See BACKUP_INSTRUCTIONS.md in the supabase folder

-- ============================================================================
-- STEP 1: Clean up orphaned/invalid data before adding constraints
-- ============================================================================

-- Remove quiz_answers with non-existent slides
DELETE FROM public.quiz_answers qa
WHERE NOT EXISTS (SELECT 1 FROM public.slides s WHERE s.id = qa.slide_id);

-- Remove quiz_answers with non-existent courses
DELETE FROM public.quiz_answers qa
WHERE qa.course_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.courses c WHERE c.id = qa.course_id);

-- Remove quiz_answers with non-existent modules
DELETE FROM public.quiz_answers qa
WHERE qa.module_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.modules m WHERE m.id = qa.module_id);

-- Remove quiz_answers with non-existent users
DELETE FROM public.quiz_answers qa
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = qa.user_id);

-- Remove main_rating with non-existent users
DELETE FROM public.main_rating mr
WHERE mr.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = mr.user_id);

-- Remove main_rating with non-existent courses
DELETE FROM public.main_rating mr
WHERE mr.course_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.courses c WHERE c.id = mr.course_id);

-- Remove main_rating with non-existent modules
DELETE FROM public.main_rating mr
WHERE mr.module_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.modules m WHERE m.id = mr.module_id);

-- Remove user_course_summaries with non-existent users
DELETE FROM public.user_course_summaries ucs
WHERE ucs.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = ucs.user_id);

-- Remove user_course_summaries with non-existent courses
DELETE FROM public.user_course_summaries ucs
WHERE ucs.course_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.courses c WHERE c.id = ucs.course_id);

-- Set last_slide_id to NULL if slide doesn't exist
UPDATE public.user_course_summaries ucs
SET last_slide_id = NULL
WHERE ucs.last_slide_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.slides s WHERE s.id = ucs.last_slide_id);

-- Remove chat_history with non-existent slides
DELETE FROM public.chat_history ch
WHERE NOT EXISTS (SELECT 1 FROM public.slides s WHERE s.id = ch.slide_id);

-- ============================================================================
-- STEP 2: Fix dangerous default values (remove gen_random_uuid() from FK columns)
-- ============================================================================

-- quiz_answers: Remove bad defaults
ALTER TABLE public.quiz_answers
  ALTER COLUMN user_id DROP DEFAULT,
  ALTER COLUMN slide_id DROP DEFAULT;

-- Note: course_id and module_id can remain nullable (for denormalization purposes)
-- but should not have random UUID defaults
ALTER TABLE public.quiz_answers
  ALTER COLUMN course_id DROP DEFAULT,
  ALTER COLUMN module_id DROP DEFAULT;

-- main_rating: Remove bad defaults
ALTER TABLE public.main_rating
  ALTER COLUMN user_id DROP DEFAULT,
  ALTER COLUMN module_id DROP DEFAULT;

-- ============================================================================
-- STEP 3: Fix timestamp inconsistency in lessons table
-- ============================================================================

ALTER TABLE public.lessons
  ALTER COLUMN created_at TYPE timestamp with time zone
    USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamp with time zone
    USING updated_at AT TIME ZONE 'UTC';

-- ============================================================================
-- STEP 4: Add missing foreign key constraints
-- ============================================================================

-- quiz_answers foreign keys
ALTER TABLE public.quiz_answers
  ADD CONSTRAINT quiz_answers_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT quiz_answers_slide_id_fkey
    FOREIGN KEY (slide_id) REFERENCES public.slides(id) ON DELETE CASCADE;

-- quiz_answers: course_id and module_id are optional (denormalized for performance)
-- Adding FKs but allowing NULL
ALTER TABLE public.quiz_answers
  ADD CONSTRAINT quiz_answers_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL,
  ADD CONSTRAINT quiz_answers_module_id_fkey
    FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE SET NULL;

-- main_rating foreign keys
ALTER TABLE public.main_rating
  ADD CONSTRAINT main_rating_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT main_rating_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD CONSTRAINT main_rating_module_id_fkey
    FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;

-- user_course_summaries foreign keys
ALTER TABLE public.user_course_summaries
  ADD CONSTRAINT user_course_summaries_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT user_course_summaries_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD CONSTRAINT user_course_summaries_last_slide_id_fkey
    FOREIGN KEY (last_slide_id) REFERENCES public.slides(id) ON DELETE SET NULL;

-- chat_history: add missing course_id FK (slide_id FK should exist)
ALTER TABLE public.chat_history
  ADD CONSTRAINT chat_history_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD CONSTRAINT chat_history_slide_id_fkey
    FOREIGN KEY (slide_id) REFERENCES public.slides(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 5: Add CASCADE delete rules to existing constraints
-- ============================================================================

-- Drop and recreate modules FK to add cascade
ALTER TABLE public.modules
  DROP CONSTRAINT IF EXISTS fk_modules_course,
  ADD CONSTRAINT fk_modules_course
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- Drop and recreate lessons FK to add cascade
ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS fk_lessons_module,
  ADD CONSTRAINT fk_lessons_module
    FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;

-- Drop and recreate slides FK to add cascade
ALTER TABLE public.slides
  DROP CONSTRAINT IF EXISTS fk_slides_lesson,
  ADD CONSTRAINT fk_slides_lesson
    FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;

-- Drop and recreate slide_ai_prompts FK to add cascade
ALTER TABLE public.slide_ai_prompts
  DROP CONSTRAINT IF EXISTS slide_ai_prompts_slide_id_fkey,
  ADD CONSTRAINT slide_ai_prompts_slide_id_fkey
    FOREIGN KEY (slide_id) REFERENCES public.slides(id) ON DELETE CASCADE;

-- Drop and recreate criterias FK to add cascade
ALTER TABLE public.criterias
  DROP CONSTRAINT IF EXISTS criterias_course_id_fkey,
  ADD CONSTRAINT criterias_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- Drop and recreate company_courses FKs to add cascade
ALTER TABLE public.company_courses
  DROP CONSTRAINT IF EXISTS fk_company_courses_company,
  DROP CONSTRAINT IF EXISTS fk_company_courses_course,
  ADD CONSTRAINT fk_company_courses_company
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_company_courses_course
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- Drop and recreate company_members FKs to add cascade
ALTER TABLE public.company_members
  DROP CONSTRAINT IF EXISTS company_members_user_id_fkey,
  DROP CONSTRAINT IF EXISTS company_members_company_id_fkey,
  ADD CONSTRAINT company_members_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD CONSTRAINT company_members_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 6: Add performance indexes
-- ============================================================================

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_slides_lesson_id ON public.slides(lesson_id);
CREATE INDEX IF NOT EXISTS idx_slides_slide_order ON public.slides(lesson_id, slide_order);

-- Progress tracking indexes
CREATE INDEX IF NOT EXISTS idx_user_course_summaries_user_id ON public.user_course_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_summaries_course_id ON public.user_course_summaries(course_id);
CREATE INDEX IF NOT EXISTS idx_user_course_summaries_user_course ON public.user_course_summaries(user_id, course_id);

-- Quiz and rating indexes
CREATE INDEX IF NOT EXISTS idx_quiz_answers_user_id ON public.quiz_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_course_id ON public.quiz_answers(course_id);
CREATE INDEX IF NOT EXISTS idx_main_rating_user_id ON public.main_rating(user_id);
CREATE INDEX IF NOT EXISTS idx_main_rating_course_id ON public.main_rating(course_id);
CREATE INDEX IF NOT EXISTS idx_main_rating_module_id ON public.main_rating(module_id);

-- Chat history indexes
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_slide_id ON public.chat_history(slide_id);

-- Company indexes
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_courses_company_id ON public.company_courses(company_id);
CREATE INDEX IF NOT EXISTS idx_company_courses_course_id ON public.company_courses(course_id);

-- Criterias index
CREATE INDEX IF NOT EXISTS idx_criterias_course_id ON public.criterias(course_id);

-- ============================================================================
-- STEP 7: Add unique constraint for user_course_summaries
-- ============================================================================

-- Ensure one summary per user per course (if not already exists)
-- First, remove duplicates keeping the most recent
DELETE FROM public.user_course_summaries a
USING public.user_course_summaries b
WHERE a.user_id = b.user_id
  AND a.course_id = b.course_id
  AND a.created_at < b.created_at;

-- Add unique constraint
ALTER TABLE public.user_course_summaries
  DROP CONSTRAINT IF EXISTS user_course_summaries_user_course_unique,
  ADD CONSTRAINT user_course_summaries_user_course_unique UNIQUE (user_id, course_id);

-- ============================================================================
-- STEP 8: Rename criterias to criteria (optional - commented out as it requires app changes)
-- ============================================================================

-- CAUTION: Uncomment only after updating all app code references
-- ALTER TABLE public.criterias RENAME TO criteria;
-- ALTER INDEX criterias_pkey RENAME TO criteria_pkey;
-- ALTER INDEX idx_criterias_course_id RENAME TO idx_criteria_course_id;

-- ============================================================================
-- Done! Verify with: SELECT * FROM information_schema.table_constraints WHERE table_schema = 'public';
-- ============================================================================
