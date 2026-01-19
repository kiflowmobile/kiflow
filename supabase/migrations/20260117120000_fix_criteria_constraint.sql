-- Migration: Fix criteria constraint name
-- Description: Fixes the constraint name that failed to rename in schema_simplification migration
-- Date: 2026-01-17

BEGIN;

-- Fix the foreign key constraint name for criteria table
-- The constraint might still be named 'criterias_course_id_fkey' if the rename failed
DO $$
BEGIN
  -- Check if the old constraint name exists and rename it
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'criterias_course_id_fkey' 
    AND conrelid = 'public.criteria'::regclass
  ) THEN
    ALTER TABLE public.criteria
      RENAME CONSTRAINT criterias_course_id_fkey TO criteria_course_id_fkey;
    RAISE NOTICE 'Renamed constraint from criterias_course_id_fkey to criteria_course_id_fkey';
  ELSIF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'criteria_course_id_fkey' 
    AND conrelid = 'public.criteria'::regclass
  ) THEN
    -- Constraint doesn't exist at all, create it
    -- This handles the case where the original schema didn't have the constraint
    ALTER TABLE public.criteria
      ADD CONSTRAINT criteria_course_id_fkey
      FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE SET NULL;
    RAISE NOTICE 'Created constraint criteria_course_id_fkey';
  ELSE
    RAISE NOTICE 'Constraint criteria_course_id_fkey already exists with correct name';
  END IF;
END $$;

COMMIT;
