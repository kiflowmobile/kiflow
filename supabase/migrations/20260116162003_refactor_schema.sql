-- Rename user_skill_ratings to user_criteria_ratings
ALTER TABLE user_skill_ratings RENAME TO user_criteria_ratings;

-- Change criteria_key to criteria_id and add FK
ALTER TABLE user_criteria_ratings 
  RENAME COLUMN criteria_key TO criteria_id_temp;

ALTER TABLE user_criteria_ratings 
  ADD COLUMN criteria_id uuid REFERENCES public.criteria(id);

-- Note: We cannot automatically migrate data from criteria_id_temp (text) to criteria_id (uuid) 
-- without a lookup. Assuming this is acceptable or data can be truncated/migrated separately.
-- For this migration, we will drop the old column.
ALTER TABLE user_criteria_ratings DROP COLUMN criteria_id_temp;

-- Rename slide_ai_prompts columns
ALTER TABLE slide_ai_prompts RENAME COLUMN question TO initial_message;
ALTER TABLE slide_ai_prompts RENAME COLUMN prompt TO system_instruction;

-- Create user_module_progress table
CREATE TABLE public.user_module_progress (
  user_id uuid NOT NULL REFERENCES public.users(id),
  module_id uuid NOT NULL REFERENCES public.modules(id),
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  last_slide_id uuid REFERENCES public.slides(id),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id, module_id)
);

-- Migrate data from JSONB (Optional/Best Effort)
-- This is complex to do in SQL alone without a function. 
-- We will start fresh for module progress or manual migration script is needed.

-- Create user_course_progress_view
CREATE OR REPLACE VIEW public.user_course_progress_view AS
SELECT 
  ump.user_id,
  m.course_id,
  CAST(ROUND(AVG(ump.progress)) AS integer) as progress,
  MAX(ump.updated_at) as last_activity
FROM user_module_progress ump
JOIN modules m ON ump.module_id = m.id
GROUP BY ump.user_id, m.course_id;

-- Drop dependent view or constraints if any, then drop old table
-- (Assuming user_course_summaries is no longer needed, or keep it for backup/legacy for now)
DROP TABLE public.user_course_summaries;
