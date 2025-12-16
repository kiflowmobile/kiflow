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


-- /// створення звʼязків між таблицями 

ALTER TABLE public.main_rating
ADD CONSTRAINT main_rating_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ALTER TABLE public.chat_history
-- ADD CONSTRAINT chat_history_user_id_fkey
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_answers
ADD CONSTRAINT quiz_answers_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_course_summaries
ADD CONSTRAINT user_course_summaries_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;



alter table public.criterias
add constraint criterias_course_id_fkey
foreign key (course_id)
references public.courses(id)
on delete cascade;



