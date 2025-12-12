-- Додаємо колонку lesson_id
ALTER TABLE public.main_rating
ADD COLUMN lesson_id uuid;


DROP INDEX IF EXISTS main_rating_unique_user_module_criteria_course;


CREATE UNIQUE INDEX main_rating_unique_user_module_criteria_course_lesson
ON public.main_rating (user_id, module_id, criteria_key, course_id, lesson_id);


-- /// створення полісі для chat_history на вставху данних для зареєстрованих користувачів 

create policy "users can insert own rows"
on public.chat_history
for insert
to authenticated
with check (auth.uid() = user_id);