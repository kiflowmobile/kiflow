-- Додаємо колонку course_id
ALTER TABLE public.main_rating
ADD COLUMN IF NOT EXISTS course_id uuid;

-- Створюємо унікальний індекс з новою колонкою
CREATE UNIQUE INDEX IF NOT EXISTS main_rating_unique_user_module_criteria_course
ON public.main_rating (user_id, module_id, criteria_key, course_id);
