-- Rollback Migration: Schema Integrity Fixes
-- Use this script to undo the changes made by 20260107120000_schema_integrity_fixes.sql
-- WARNING: This will NOT restore deleted orphaned data!

-- ============================================================================
-- STEP 1: Remove indexes (safe to remove, can always recreate)
-- ============================================================================

DROP INDEX IF EXISTS public.idx_modules_course_id;
DROP INDEX IF EXISTS public.idx_lessons_module_id;
DROP INDEX IF EXISTS public.idx_slides_lesson_id;
DROP INDEX IF EXISTS public.idx_slides_slide_order;
DROP INDEX IF EXISTS public.idx_user_course_summaries_user_id;
DROP INDEX IF EXISTS public.idx_user_course_summaries_course_id;
DROP INDEX IF EXISTS public.idx_user_course_summaries_user_course;
DROP INDEX IF EXISTS public.idx_quiz_answers_user_id;
DROP INDEX IF EXISTS public.idx_quiz_answers_course_id;
DROP INDEX IF EXISTS public.idx_main_rating_user_id;
DROP INDEX IF EXISTS public.idx_main_rating_course_id;
DROP INDEX IF EXISTS public.idx_main_rating_module_id;
DROP INDEX IF EXISTS public.idx_chat_history_user_id;
DROP INDEX IF EXISTS public.idx_chat_history_slide_id;
DROP INDEX IF EXISTS public.idx_company_members_company_id;
DROP INDEX IF EXISTS public.idx_company_courses_company_id;
DROP INDEX IF EXISTS public.idx_company_courses_course_id;
DROP INDEX IF EXISTS public.idx_criterias_course_id;

-- ============================================================================
-- STEP 2: Remove unique constraint on user_course_summaries
-- ============================================================================

ALTER TABLE public.user_course_summaries
  DROP CONSTRAINT IF EXISTS user_course_summaries_user_course_unique;

-- ============================================================================
-- STEP 3: Remove newly added foreign key constraints
-- ============================================================================

-- quiz_answers
ALTER TABLE public.quiz_answers
  DROP CONSTRAINT IF EXISTS quiz_answers_user_id_fkey,
  DROP CONSTRAINT IF EXISTS quiz_answers_slide_id_fkey,
  DROP CONSTRAINT IF EXISTS quiz_answers_course_id_fkey,
  DROP CONSTRAINT IF EXISTS quiz_answers_module_id_fkey;

-- main_rating
ALTER TABLE public.main_rating
  DROP CONSTRAINT IF EXISTS main_rating_user_id_fkey,
  DROP CONSTRAINT IF EXISTS main_rating_course_id_fkey,
  DROP CONSTRAINT IF EXISTS main_rating_module_id_fkey;

-- user_course_summaries
ALTER TABLE public.user_course_summaries
  DROP CONSTRAINT IF EXISTS user_course_summaries_user_id_fkey,
  DROP CONSTRAINT IF EXISTS user_course_summaries_course_id_fkey,
  DROP CONSTRAINT IF EXISTS user_course_summaries_last_slide_id_fkey;

-- chat_history
ALTER TABLE public.chat_history
  DROP CONSTRAINT IF EXISTS chat_history_course_id_fkey,
  DROP CONSTRAINT IF EXISTS chat_history_slide_id_fkey;

-- ============================================================================
-- STEP 4: Restore original foreign keys WITHOUT cascade
-- ============================================================================

-- modules
ALTER TABLE public.modules
  DROP CONSTRAINT IF EXISTS fk_modules_course,
  ADD CONSTRAINT fk_modules_course
    FOREIGN KEY (course_id) REFERENCES public.courses(id);

-- lessons
ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS fk_lessons_module,
  ADD CONSTRAINT fk_lessons_module
    FOREIGN KEY (module_id) REFERENCES public.modules(id);

-- slides
ALTER TABLE public.slides
  DROP CONSTRAINT IF EXISTS fk_slides_lesson,
  ADD CONSTRAINT fk_slides_lesson
    FOREIGN KEY (lesson_id) REFERENCES public.lessons(id);

-- slide_ai_prompts
ALTER TABLE public.slide_ai_prompts
  DROP CONSTRAINT IF EXISTS slide_ai_prompts_slide_id_fkey,
  ADD CONSTRAINT slide_ai_prompts_slide_id_fkey
    FOREIGN KEY (slide_id) REFERENCES public.slides(id);

-- criterias
ALTER TABLE public.criterias
  DROP CONSTRAINT IF EXISTS criterias_course_id_fkey,
  ADD CONSTRAINT criterias_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES public.courses(id);

-- company_courses
ALTER TABLE public.company_courses
  DROP CONSTRAINT IF EXISTS fk_company_courses_company,
  DROP CONSTRAINT IF EXISTS fk_company_courses_course,
  ADD CONSTRAINT fk_company_courses_company
    FOREIGN KEY (company_id) REFERENCES public.companies(id),
  ADD CONSTRAINT fk_company_courses_course
    FOREIGN KEY (course_id) REFERENCES public.courses(id);

-- company_members
ALTER TABLE public.company_members
  DROP CONSTRAINT IF EXISTS company_members_user_id_fkey,
  DROP CONSTRAINT IF EXISTS company_members_company_id_fkey,
  ADD CONSTRAINT company_members_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id),
  ADD CONSTRAINT company_members_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES public.companies(id);

-- ============================================================================
-- STEP 5: Restore original defaults (the bad ones - only if needed for compatibility)
-- ============================================================================

-- WARNING: Re-adding these is NOT recommended, but included for completeness
-- Uncomment only if your app code depends on these defaults

-- ALTER TABLE public.quiz_answers
--   ALTER COLUMN user_id SET DEFAULT gen_random_uuid(),
--   ALTER COLUMN slide_id SET DEFAULT gen_random_uuid(),
--   ALTER COLUMN course_id SET DEFAULT gen_random_uuid(),
--   ALTER COLUMN module_id SET DEFAULT gen_random_uuid();

-- ALTER TABLE public.main_rating
--   ALTER COLUMN user_id SET DEFAULT gen_random_uuid(),
--   ALTER COLUMN module_id SET DEFAULT gen_random_uuid();

-- ============================================================================
-- STEP 6: Revert timestamp type change in lessons (if needed)
-- ============================================================================

-- WARNING: This will lose timezone info
-- ALTER TABLE public.lessons
--   ALTER COLUMN created_at TYPE timestamp without time zone,
--   ALTER COLUMN updated_at TYPE timestamp without time zone;

-- ============================================================================
-- Rollback complete
-- ============================================================================
