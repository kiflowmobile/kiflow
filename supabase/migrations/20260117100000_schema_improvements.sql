-- Schema improvements migration
-- Fixes inconsistencies and adds missing indexes/constraints

-- =============================================================================
-- 1. Fix inconsistent timestamp types in lessons table
-- =============================================================================
ALTER TABLE public.lessons
  ALTER COLUMN created_at TYPE timestamp with time zone USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE timestamp with time zone USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE public.lessons
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT now();

-- =============================================================================
-- 2. Add missing updated_at columns
-- =============================================================================
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
ALTER TABLE public.criteria ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- =============================================================================
-- 3. Fix module_order type (numeric -> integer for consistency)
-- =============================================================================
ALTER TABLE public.modules
  ALTER COLUMN module_order TYPE integer USING module_order::integer;

-- =============================================================================
-- 4. Add NOT NULL constraints where appropriate (with safe defaults)
-- =============================================================================
-- criteria.key and criteria.name should not be null
UPDATE public.criteria SET key = 'unknown' WHERE key IS NULL;
UPDATE public.criteria SET name = 'Unnamed Criteria' WHERE name IS NULL;

ALTER TABLE public.criteria
  ALTER COLUMN key SET NOT NULL,
  ALTER COLUMN name SET NOT NULL;

-- =============================================================================
-- 5. Add unique constraint on slide_ai_prompts.slide_id (one prompt per slide)
-- =============================================================================
-- First, remove duplicates if any (keep the most recent)
DELETE FROM public.slide_ai_prompts a
USING public.slide_ai_prompts b
WHERE a.slide_id = b.slide_id
  AND a.created_at < b.created_at;

ALTER TABLE public.slide_ai_prompts
  ADD CONSTRAINT slide_ai_prompts_slide_id_unique UNIQUE (slide_id);

-- =============================================================================
-- 6. Add indexes on foreign keys for query performance
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_slides_lesson_id ON public.slides(lesson_id);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON public.modules(course_id);
CREATE INDEX IF NOT EXISTS idx_criteria_course_id ON public.criteria(course_id);
CREATE INDEX IF NOT EXISTS idx_slide_ai_prompts_slide_id ON public.slide_ai_prompts(slide_id);

-- =============================================================================
-- 7. Add indexes on ordering columns for sorted queries
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_modules_course_order ON public.modules(course_id, module_order);
CREATE INDEX IF NOT EXISTS idx_lessons_module_order ON public.lessons(module_id, lesson_order);
CREATE INDEX IF NOT EXISTS idx_slides_lesson_order ON public.slides(lesson_id, slide_order);

-- =============================================================================
-- 8. Add composite indexes for common query patterns
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_user_slide_interactions_user_slide
  ON public.user_slide_interactions(user_id, slide_id);
CREATE INDEX IF NOT EXISTS idx_user_criteria_ratings_user_module
  ON public.user_criteria_ratings(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company
  ON public.company_members(company_id);

-- =============================================================================
-- 9. Add ON DELETE CASCADE for child records
-- =============================================================================

-- Modules cascade when course is deleted
ALTER TABLE public.modules
  DROP CONSTRAINT IF EXISTS fk_modules_course,
  ADD CONSTRAINT fk_modules_course
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- Lessons cascade when module is deleted
ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS fk_lessons_module,
  ADD CONSTRAINT fk_lessons_module
    FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;

-- Slides cascade when lesson is deleted
ALTER TABLE public.slides
  DROP CONSTRAINT IF EXISTS fk_slides_lesson,
  ADD CONSTRAINT fk_slides_lesson
    FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;

-- Slide AI prompts cascade when slide is deleted
ALTER TABLE public.slide_ai_prompts
  DROP CONSTRAINT IF EXISTS slide_ai_prompts_slide_id_fkey,
  ADD CONSTRAINT slide_ai_prompts_slide_id_fkey
    FOREIGN KEY (slide_id) REFERENCES public.slides(id) ON DELETE CASCADE;

-- Criteria cascade when course is deleted
ALTER TABLE public.criteria
  DROP CONSTRAINT IF EXISTS criteria_course_id_fkey,
  ADD CONSTRAINT criteria_course_id_fkey
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- Company courses cascade when company or course is deleted
ALTER TABLE public.company_courses
  DROP CONSTRAINT IF EXISTS fk_company_courses_company,
  DROP CONSTRAINT IF EXISTS fk_company_courses_course,
  ADD CONSTRAINT fk_company_courses_company
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_company_courses_course
    FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;

-- Company members cascade when company is deleted
ALTER TABLE public.company_members
  DROP CONSTRAINT IF EXISTS company_members_company_id_fkey,
  ADD CONSTRAINT company_members_company_id_fkey
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;

-- User module progress cascades
ALTER TABLE public.user_module_progress
  DROP CONSTRAINT IF EXISTS user_module_progress_module_id_fkey,
  ADD CONSTRAINT user_module_progress_module_id_fkey
    FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE;

ALTER TABLE public.user_module_progress
  DROP CONSTRAINT IF EXISTS user_module_progress_last_slide_id_fkey,
  ADD CONSTRAINT user_module_progress_last_slide_id_fkey
    FOREIGN KEY (last_slide_id) REFERENCES public.slides(id) ON DELETE SET NULL;

-- User slide interactions cascade when slide is deleted
ALTER TABLE public.user_slide_interactions
  DROP CONSTRAINT IF EXISTS user_slide_interactions_slide_id_fkey,
  ADD CONSTRAINT user_slide_interactions_slide_id_fkey
    FOREIGN KEY (slide_id) REFERENCES public.slides(id) ON DELETE CASCADE;

-- User criteria ratings - SET NULL on criteria delete, CASCADE on module delete
ALTER TABLE public.user_criteria_ratings
  DROP CONSTRAINT IF EXISTS user_skill_ratings_module_id_fkey,
  DROP CONSTRAINT IF EXISTS user_criteria_ratings_criteria_id_fkey,
  ADD CONSTRAINT user_criteria_ratings_module_id_fkey
    FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE,
  ADD CONSTRAINT user_criteria_ratings_criteria_id_fkey
    FOREIGN KEY (criteria_id) REFERENCES public.criteria(id) ON DELETE SET NULL;

-- =============================================================================
-- 10. Create updated_at trigger function (if not exists)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 11. Add updated_at triggers to tables
-- =============================================================================
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_modules_updated_at ON public.modules;
CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_lessons_updated_at ON public.lessons;
CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_slides_updated_at ON public.slides;
CREATE TRIGGER update_slides_updated_at
  BEFORE UPDATE ON public.slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_criteria_updated_at ON public.criteria;
CREATE TRIGGER update_criteria_updated_at
  BEFORE UPDATE ON public.criteria
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_slide_ai_prompts_updated_at ON public.slide_ai_prompts;
CREATE TRIGGER update_slide_ai_prompts_updated_at
  BEFORE UPDATE ON public.slide_ai_prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_module_progress_updated_at ON public.user_module_progress;
CREATE TRIGGER update_user_module_progress_updated_at
  BEFORE UPDATE ON public.user_module_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_slide_interactions_updated_at ON public.user_slide_interactions;
CREATE TRIGGER update_user_slide_interactions_updated_at
  BEFORE UPDATE ON public.user_slide_interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
