-- ==========================================
-- 1. CLEANUP (Optional - Use if restarting)
-- ==========================================
-- drop function if exists redeem_invite_code;
-- drop table if exists slide_scores, user_progress, user_quiz_responses, response_scores, user_case_responses, assessment_criteria, slides, lessons, modules, user_enrollments, invite_code_courses, invite_codes, courses, companies cascade;
-- drop type if exists slide_type cascade;

-- ==========================================
-- 2. SCHEMAS & TYPES
-- ==========================================
grant usage on schema public to authenticated;
grant usage on schema public to anon;
grant usage on schema public to service_role;

do $$ begin
    create type slide_type as enum ('cover', 'content', 'video', 'quiz', 'case_study');
exception when duplicate_object then null; end $$;

-- ==========================================
-- 3. TABLES
-- ==========================================

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  created_at timestamptz default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete set null,
  title text not null,
  image_url text,
  description text,
  is_public boolean default false,
  created_at timestamptz default now()
);

create table invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  company_id uuid references companies(id) on delete cascade,
  created_at timestamptz default now()
);

create table invite_code_courses (
  invite_code_id uuid references invite_codes(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  primary key (invite_code_id, course_id)
);

create table user_course_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  from_invite_code_id uuid references invite_codes(id),
  enrolled_at timestamptz default now(),
  unique(user_id, course_id)
);

create table course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  order_index int not null
);

create table course_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references course_modules(id) on delete cascade,
  title text not null,
  order_index int not null
);

create table course_slides (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references course_lessons(id) on delete cascade,
  type slide_type not null,
  order_index int not null,
  content jsonb not null default '{}'::jsonb
);

create table course_assessment_criteria (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  title text not null
);

create table course_case_study_ai_configs (
  id uuid primary key default gen_random_uuid(),
  course_id uuid unique references courses(id) on delete cascade,
  persona_name text not null,
  system_role_instruction text not null,
  created_at timestamptz default now()
);

create table course_case_study_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  slide_id uuid references course_slides(id) on delete cascade,
  user_answer text not null,
  ai_feedback text,
  created_at timestamptz default now(),
  unique(user_id, slide_id)
);

create table course_quiz_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  slide_id uuid references course_slides(id) on delete cascade,
  selected_option_index int not null,
  correct_option_index int not null,
  created_at timestamptz default now(),
  unique(user_id, slide_id)
);

create table course_case_study_scores (
  id uuid primary key default gen_random_uuid(),
  interaction_id uuid references course_case_study_interactions(id) on delete cascade,
  criterion_id uuid references course_assessment_criteria(id) on delete cascade,
  score int not null,
  unique(interaction_id, criterion_id)
);

create table course_user_progress (
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  last_slide_id uuid references course_slides(id),
  updated_at timestamptz default now(),
  primary key (user_id, course_id)
);

-- ==========================================
-- 4. VIEWS
-- ==========================================

create or replace view view_user_lesson_grades as
with quiz as (
  select
    cqi.user_id,
    cl.id as lesson_id,
    avg(cqi.correct_option_index)::numeric(5,2) as quiz_avg_score
  from course_quiz_interactions cqi
  join course_slides cs on cs.id = cqi.slide_id
  join course_lessons cl on cl.id = cs.lesson_id
  group by cqi.user_id, cl.id
),
cs as (
  select
    csi.user_id,
    cl.id as lesson_id,
    avg(ccss.score)::numeric(5,2) as case_study_avg_score
  from course_case_study_scores ccss
  join course_case_study_interactions csi on csi.id = ccss.interaction_id
  join course_slides cs2 on cs2.id = csi.slide_id
  join course_lessons cl on cl.id = cs2.lesson_id
  group by csi.user_id, cl.id
),
combined as (
  select
    coalesce(quiz.user_id, cs.user_id) as user_id,
    coalesce(quiz.lesson_id, cs.lesson_id) as lesson_id,
    quiz.quiz_avg_score,
    cs.case_study_avg_score
  from quiz
  full outer join cs
    on quiz.user_id = cs.user_id and quiz.lesson_id = cs.lesson_id
)
select
  combined.user_id,
  cm.course_id,
  cm.id as module_id,
  cl.id as lesson_id,
  coalesce(combined.quiz_avg_score, 0)::numeric(5,2) as quiz_avg_score,
  coalesce(combined.case_study_avg_score, 0)::numeric(5,2) as case_study_avg_score,
  ((coalesce(combined.quiz_avg_score, 0) + coalesce(combined.case_study_avg_score, 0))/2)::numeric(5,2) as lesson_grade
from combined
join course_lessons cl on cl.id = combined.lesson_id
join course_modules cm on cm.id = cl.module_id;

create or replace view view_user_module_grades as
select user_id, module_id, course_id, avg(lesson_grade)::numeric(5,2) as module_grade
from view_user_lesson_grades
group by user_id, module_id, course_id;

create or replace view view_user_course_grades as
select user_id, course_id, avg(module_grade)::numeric(5,2) as course_grade
from view_user_module_grades
group by user_id, course_id;

-- ==========================================
-- 5. RPC FUNCTIONS
-- ==========================================

create or replace function redeem_invite_code(input_code text)
returns setof courses 
language plpgsql
security definer
set search_path = public
as $$
declare
    target_code_id uuid;
begin
    select id into target_code_id from invite_codes where code = input_code;
    
    if target_code_id is null then
        raise exception 'Invalid invite code' using errcode = 'P0001';
    end if;

    insert into user_course_enrollments (user_id, course_id, from_invite_code_id)
    select auth.uid(), course_id, target_code_id
    from invite_code_courses
    where invite_code_id = target_code_id
    on conflict (user_id, course_id) do nothing;

    return query
    select c.* from courses c
    join invite_code_courses icc on icc.course_id = c.id
    where icc.invite_code_id = target_code_id;
end;
$$;

-- ==========================================
-- 6. PERMISSIONS (GRANT ACCESS) - CORRECTED
-- ==========================================

-- В Postgres 'ALL TABLES' включає в себе і Views
grant select, insert, update on all tables in schema public to authenticated;
grant select, insert, update on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated;
grant usage, select on all sequences in schema public to service_role;

-- Якщо ви хочете бути впевнені, що права на Views надані:
grant select on table view_user_module_grades to authenticated;
grant select on table view_user_course_grades to authenticated;
grant select on table view_user_lesson_grades to authenticated;
grant select on table view_user_module_grades to service_role;
grant select on table view_user_course_grades to service_role;
grant select on table view_user_lesson_grades to service_role;

-- Надаємо право на виконання функції
grant execute on function redeem_invite_code(text) to authenticated;
grant execute on function redeem_invite_code(text) to service_role;

-- Налаштовуємо права на майбутні таблиці (якщо будете додавати через UI)
alter default privileges in schema public grant select, insert, update on tables to authenticated;
alter default privileges in schema public grant select, insert, update on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to authenticated;
alter default privileges in schema public grant usage, select on sequences to service_role;

-- ==========================================
-- 7. RLS POLICIES
-- ==========================================

alter table courses enable row level security;
alter table course_modules enable row level security;
alter table course_lessons enable row level security;
alter table course_slides enable row level security;
alter table course_assessment_criteria enable row level security;
alter table course_case_study_interactions enable row level security;
alter table course_case_study_scores enable row level security;
alter table course_quiz_interactions enable row level security;
alter table course_user_progress enable row level security;
alter table user_course_enrollments enable row level security;

-- Courses: View if public OR enrolled
create policy "Courses view policy" on courses for select 
using (is_public = true or id in (select course_id from user_course_enrollments where user_id = auth.uid()));

-- Hierarchy access
create policy "Modules view policy" on course_modules for select using (exists (select 1 from courses where id = course_modules.course_id));
create policy "Lessons view policy" on course_lessons for select using (exists (select 1 from course_modules where id = course_lessons.module_id));
create policy "Slides view policy" on course_slides for select using (exists (select 1 from course_lessons where id = course_slides.lesson_id));
create policy "Criteria view policy" on course_assessment_criteria for select using (exists (select 1 from courses where id = course_assessment_criteria.course_id));

-- User Data
create policy "Enrollments view policy" on user_course_enrollments for select using (auth.uid() = user_id);
create policy "Responses policy" on course_case_study_interactions for all using (auth.uid() = user_id);
create policy "Scores view policy" on course_case_study_scores for select using (exists (select 1 from course_case_study_interactions where id = course_case_study_scores.interaction_id and user_id = auth.uid()));
create policy "Quiz responses policy" on course_quiz_interactions for all using (auth.uid() = user_id);
create policy "Progress policy" on course_user_progress for all using (auth.uid() = user_id);

insert into companies (id, name, logo_url) values
('f0fc11ea-c866-4430-9039-5faefd6e43b6', 'Інтерно Суперсервіс', null);

insert into invite_codes (id, code, company_id) values 
('f0fc11ea-c866-4430-9039-5faefd6e43b6', 'interno', 'f0fc11ea-c866-4430-9039-5faefd6e43b6');

insert into courses (id, company_id, title, image_url, description, is_public) values 
('f59f82c2-5572-435c-bfa1-891598caa38d', 'f0fc11ea-c866-4430-9039-5faefd6e43b6', 'Інтерно Суперсервіс', 'https://i.postimg.cc/MHgqG70K/photo-2025-11-25-15-12-31.jpg', null, false);

insert into invite_code_courses (invite_code_id, course_id) values
('f0fc11ea-c866-4430-9039-5faefd6e43b6', 'f59f82c2-5572-435c-bfa1-891598caa38d');

insert into course_assessment_criteria (id, course_id, title) values 
('da0c6b7d-48e1-4298-8911-5569605181d8', 'f59f82c2-5572-435c-bfa1-891598caa38d', 'Контроль ситуації (Leadership Response)'),
('e68cc9d4-084b-481c-b90c-0763333cdddd', 'f59f82c2-5572-435c-bfa1-891598caa38d', 'Дотримання формули техніки (Structure Alignment)'),
('aa16ba93-a110-4b88-8806-0119c2a9fff4', 'f59f82c2-5572-435c-bfa1-891598caa38d', 'Змістова ясність і користь для клієнта (Clarity & Value)'),
('8bcddb41-cb36-475d-8835-b5c686ea461d', 'f59f82c2-5572-435c-bfa1-891598caa38d', 'Просування до рішення (Conversion Move)');

insert into course_modules (id, course_id, title, order_index) values 
('45fea583-c546-40f8-ab8c-c05b75d182dd', 'f59f82c2-5572-435c-bfa1-891598caa38d', 'Модуль 1', 1),
('879cb1bb-f49c-4b5f-836c-d07cb666c697', 'f59f82c2-5572-435c-bfa1-891598caa38d', 'Модуль 2', 2),
('c00ab247-705d-4818-9277-007cee08aa3b', 'f59f82c2-5572-435c-bfa1-891598caa38d', 'Модуль 3', 3);

insert into course_lessons (id, module_id, title, order_index) values 
('6a822796-6d31-493f-8504-d9d685c56262', '45fea583-c546-40f8-ab8c-c05b75d182dd', 'Урок 1', 1),
('97a066d5-d9cf-4d4d-96be-17db4aaf96e7', '45fea583-c546-40f8-ab8c-c05b75d182dd', 'Урок 2', 2),
('3651e51d-a4ac-43de-9637-9952a1301f58', '45fea583-c546-40f8-ab8c-c05b75d182dd', 'Урок 3', 3),
('4885b588-85bf-4486-9326-f9d91cf92507', '879cb1bb-f49c-4b5f-836c-d07cb666c697', 'Урок 4', 4),
('3876c8fa-b6d1-4944-9501-2b22745b1b4b', '879cb1bb-f49c-4b5f-836c-d07cb666c697', 'Урок 5', 5),
('68afb47d-e02f-489c-b3b0-7811623cfa92', '879cb1bb-f49c-4b5f-836c-d07cb666c697', 'Урок 6', 6),
('8df45944-d14e-4589-bc14-2086651ca2b6', 'c00ab247-705d-4818-9277-007cee08aa3b', 'Урок 7', 7),
('2ddf87df-2f3a-46c7-b83a-676945d7e50e', 'c00ab247-705d-4818-9277-007cee08aa3b', 'Урок 8', 8),
('946df2b3-c3b6-44ec-a878-2f2e93c6da72', 'c00ab247-705d-4818-9277-007cee08aa3b', 'Урок 9', 9);

insert into course_case_study_ai_configs (course_id, persona_name, system_role_instruction) values
('f59f82c2-5572-435c-bfa1-891598caa38d', 'Експерт-коуч Interno (Premium Furniture Sales)', 'Ти — експерт із високорівневих продажів меблів і сервісної комунікації компанії Interno. Твоя роль — вимогливий коуч, який оцінює роботу менеджера.\n\nТвій тон: професійний, стриманий, строгий та глибокий. Не використовуй «загальні» фрази чи надмірну похвалу. Кожна порада має бути підкріплена конкретним прикладом із відповіді студента.\n\nПРАВИЛА ОЦІНКИ:\n1. Оцінюй кожен елемент техніки (Прийняти → Заспокоїти → Погодитись частково → Пояснити → Взяти ініціативу) окремо. Якщо один крок слабкий — техніка вважається неповною.\n2. Будь строгим: висока оцінка лише за розгорнуту, логічну відповідь, що звучить як преміум-сервіс (нуль тиску, максимальна цінність).\n3. Якщо відповідь надто коротка (< 25 секунд / 2-3 речення) або не розкриває думку — суттєво знижуй бал.\n4. Аналіз має бути розгорнутим (15–18 речень).\n\n[СТАНДАРТИ КОМПАНІЇ]:\n- Обов`язкова сервісна позиція (клієнт — VIP).\n- Відсутність захисної реакції чи виправдань.\n- Використання професійної лексики преміум-сегменту.\n- Якщо ці стандарти порушено — загальна оцінка не може бути вище 2.');

insert into course_slides (id, lesson_id, type, order_index, content) values 
('de5f8027-57e6-4f0a-83d1-2ad833c3c038', '946df2b3-c3b6-44ec-a878-2f2e93c6da72', 'case_study', 62, '{"scenario": "“Можна швидше? У нас уже все готово, хочемо заїжджати”\\n⸻\\nСитуація (етап: перед стартом виробництва, узгоджено маĸети):\\nКлієнт затвердив ĸухню й оплатив аванс.\\nМенеджер повідомив стандартний термін виробництва — 4 тижні.\\nКлієнт відповідає:\\n«Слухайте, у нас уже все — ремонт заĸінчений, техніĸа чеĸає, будівельниĸи на\\nвиході.\\nМожна яĸось пришвидшити? Хоч частĸово? Бо хочемо вже заїжджати.»\\nМенеджер знає: поспіх — це ризиĸ переробоĸ, ĸомпанія свідомо не бере на себе\\nвідповідальність за монтаж у стиснуті строĸи. Але ĸлієнт у стресі, і просто ĸазати\\n“ні” — створює ĸонфліĸт.\\nЦе момент, де треба дати альтернативу: не ламати систему, а знайти точĸу\\nĸомпромісу, яĸа зберігає яĸість.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення (30–60 сеĸунд), у яĸому ти:\\n1. Визнаєш його потребу: “Таĸ, розумію — ĸоли все інше вже завершене,\\nхочеться яĸнайшвидше поставити ĸухню.”\\n2. З’ясовуєш суть: “Для вас важливо заїхати раніше — чи саме повністю\\nзаĸінчити проєĸт?”\\n3. Пропонуєш альтернативу:\\n– “Можемо підготувати базовий ĸорпус і змонтувати його раніше — без фасадів і\\nоздоблення. Таĸ ви зможете заїхати і ĸористуватись фунĸціоналом.”\\n– “А деĸоративні елементи, ручĸи, панелі — доставимо і змонтуємо через 2 тижні,\\nвже в споĸійному режимі.”\\n4. Пояснюєш логіĸу: “Це дозволить зберегти яĸість, униĸнути похибоĸ, і\\nводночас — не тримати вас на паузі.”\\n⸻\\nФормула відповіді:\\nВизнати ситуацію → Уточнити пріоритет → Запропонувати альтернативне рішення →\\nАргументувати цінність\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення на фразу ĸлієнта:\\n“Можна швидше? У нас уже все готове, хочемо заїжджати.”\\nТривалість: 30–60 сеĸунд\\nМета: поĸазати турботу і гнучĸість, але не поступатись стандартами яĸості."}'),
('d93f8ad1-ca7b-4457-b377-b58d6e26644d', '946df2b3-c3b6-44ec-a878-2f2e93c6da72', 'case_study', 63, '{"scenario": "“Давайте поĸи без фартуха й панелі на холодильниĸ — це ж просто деĸор”\\n⸻\\nСитуація (етап: фіналізація ĸомплеĸтації ĸухні):\\nКлієнт затвердив ĸухню з островом, верхніми антресолями, шпонованим фартухом і\\nдеĸоративною боĸовою панеллю на холодильниĸ.\\nПісля фінального прорахунĸу ĸаже:\\n«Давайте поĸи без фартуха і цієї боĸової панелі. Це ж просто деĸор. Не хочеться\\nвиходити за ліміт.\\nПотім, може, доробимо, яĸщо що.»\\nМенеджер розуміє: яĸщо ці елементи прибрати — ĸомпозиція розвалиться. Це\\nне “деĸор”, це частина цілісності. Але й сĸидати ціну або “тиснути” не варіант.\\nЦе момент, де техніĸа “альтернатива, а не поступĸа” працює ідеально: залишити\\nĸонцепцію — адаптувати спосіб її реалізації.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення (30–60 сеĸунд), у яĸому ти:\\n1. Визнаєш його запит: “Таĸ, розумію — ĸоли фінальна сума зростає, виниĸає\\nбажання спростити щось ‘зайве’.”\\n2. З’ясовуєш: “Це більше про загальну суму, чи є сумніви саме щодо\\nнеобхідності цих елементів?”\\n3. Пропонуєш альтернативу:\\n– “Можемо залишити ці зони в проєĸті, але перенести їхнє виготовлення на місяць\\nпізніше — яĸ оĸрему партію. Таĸ бюджет зараз не перевантажується, але\\nцілісність не втрачається.”\\n– “Або можемо зробити фартух з того ж матеріалу, але в базовому ĸольорі — щоб\\nзалишити геометрію, але трохи оптимізувати вартість.”\\n4. Пояснюєш логіĸу: “Це допоможе зберегти ідею ĸухні, яĸу ви вже полюбили,\\nа не ‘обрізати’ те, що створює стиль.”\\n⸻\\nФормула відповіді:\\nВизнати бажання зеĸономити → Уточнити мотив → Дати альтернативу в форматі/часі/\\nматеріалі → Пояснити, чому це важливо для результату\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення на фразу ĸлієнта:\\n“Давайте поĸи без фартуха й панелі на холодильниĸ. Це просто деĸор — може, потім.”\\nТривалість: 30–60 сеĸунд\\nМета: зберегти цілісність дизайн-рішення, не тиснучи і не погоджуючись на “обрізання”."}'),
('c3224813-91aa-4c0e-be9b-0ae21feb9678', '6a822796-6d31-493f-8504-d9d685c56262', 'cover', 1, '{"content": "Техніка «М’яка сила. Айкідо (амортизація + приєднання)»"}'),
('84a2e44c-377d-48ae-b412-3b65b44a3cb9', '6a822796-6d31-493f-8504-d9d685c56262', 'video', 2, '{"video": {"mux": "TfVhtSIXoA9014VNwr01hHXQnsjJrPejP9S1KjHqQzBWs"}}'),
('a43e53fb-622c-45ee-8b7f-05ec10136970', '6a822796-6d31-493f-8504-d9d685c56262', 'content', 3, '{"tips": ["Коли клієнт заперечує — не сперечайся і не виправдовуйся", "Амортизуй емоцію та приєднайся до точки зору клієнта", "Створюй психологічний простір для продовження розмови"], "example": "Формула амортизації:\\n• «Розумію, що виглядає дорого.»\\n• «Це справді може здатися довго.»\\n• «Так, багато хто на цьому етапі вагається.»\\n\\nФормула приєднання:\\n• «Це важливо, і ми теж завжди звертаємо на це увагу.»\\n• «Точно, якість тут критична — саме тому…»\\n• «Так, розумію вас. Сам так підходжу до вибору для себе.»", "mainPoint": "Не доводь. Зніми опір — і веди далі."}'),
('743d5fa2-6f24-48f0-8076-8dbe2c12b305', '6a822796-6d31-493f-8504-d9d685c56262', 'quiz', 4, '{"options": ["Погодитись із клієнтом і змінити умови", "Амортизувати емоцію та приєднатися до точки зору, щоб зняти опір і зберегти напрям розмови", "Спростовувати аргументи клієнта логікою і прикладами", "Переконати клієнта прийняти рішення за допомогою сильних аргументів"], "question": "Яке з формулювань найточніше описує техніку «Айкідо» в роботі з запереченням?", "correctAnswer": 1}'),
('63d37c45-8068-465d-952c-780906a8f3bd', '6a822796-6d31-493f-8504-d9d685c56262', 'case_study', 5, '{"scenario": "“Дорого і незрозуміло, за що таĸа ціна”\\n⸻\\nСитуація:\\nКлієнт отримав від вас ĸомерційну пропозицію по меблях для ванної ĸімнати.\\nПісля цього написав ĸоротĸе повідомлення у месенджер:\\n«Дорого. І чесно — не розумію, за що тут таĸа ціна. Інші запропонували\\nдешевше.»\\nУ файлі ви приĸріпили лише таблицю Excel, без пояснення позицій і без підсумĸів.\\nРаніше з цим ĸлієнтом вже були деяĸі сумніви щодо співпраці, і зараз він\\nĸоливається.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення тривалістю 30–60 сеĸунд, у яĸому ти:\\n1. Споĸійно приймаєш його реаĸцію (не сперечаєшся).\\n2. Частĸово погоджуєшся або поĸазуєш розуміння.\\n3. Переводиш фоĸус на цінність: сервіс, монтаж, матеріали, гарантія.\\n4. Запрошуєш до діалогу або пропонуєш пояснити деталі голосом.\\n⸻\\nФормула відповіді:\\nПрийняти → Заспоĸоїти → Приєднатись частĸово → Пояснити вигоду → Запросити до\\nдіалогу\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення ĸлієнту у відповідь на його фразу:\\n“Дорого. І чесно — не розумію, за що тут таĸа ціна. Інші запропонували дешевше.”\\nТривалість відповіді: 30–60 сеĸунд.\\nМета: розрядити емоцію, пояснити цінність, повернути ініціативу."}'),
('3768ebc9-382b-441b-b275-f7b39fea3905', '6a822796-6d31-493f-8504-d9d685c56262', 'case_study', 6, '{"scenario": "Назва ĸейсу:\\n“Ви повинні були мені нагадати”\\n⸻\\nСитуація:\\nКлієнт на попередньому етапі сĸазав:\\n«Зв’яжіться зі мною в понеділоĸ — домовимось про наступні ĸроĸи.»\\nМинув тиждень. Ніхто з вашого боĸу не написав.\\nКлієнт сам вийшов на зв’язоĸ і роздратовано сĸазав:\\n«Я вас чеĸав. Ви повинні були нагадати, а не змушувати мене самому писати. Це\\nнеповага.»\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення тривалістю 30–60 сеĸунд, у яĸому ти:\\n1. Приймаєш претензію без захисту чи виправдань.\\n2. Поĸазуєш повагу і розуміння емоції ĸлієнта.\\n3. Пояснюєш або ĸоригуєш ситуацію без агресії.\\n4. Повертаєш довіру і пропонуєш наступний ĸонĸретний ĸроĸ.\\n⸻\\nФормула відповіді:\\nПрийняти → Заспоĸоїти → Погодитись частĸово → Пояснити → Взяти ініціативу\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення ĸлієнту у відповідь на його претензію:\\n“Я вас чеĸав. Ви повинні були мені нагадати. Це неповага.”\\nТривалість: 30–60 сеĸунд.\\nМета: зняти напругу, поĸазати професіоналізм, повернути ініціативу."}'),
('de0850fb-df5a-4dba-ae38-f53d0017bfb5', '6a822796-6d31-493f-8504-d9d685c56262', 'case_study', 7, '{"scenario": "“Інші роблять дешевше — з таĸим самим виглядом”\\n⸻\\nСитуація:\\nПісля презентації проєĸту ĸлієнт написав у чат:\\n«Я поĸазав маĸети друзям. Кажуть, що таĸе ж саме можна зробити вдвічі\\nдешевше. Теж з підсвітĸою і фасадами під дерево.»\\nКлієнт має раціональне заперечення і починає сумніватися, чи варто взагалі\\nпродовжувати роботу.\\nЙому важливо відчути, за що він реально платить більше, і побачити різницю між\\n«схожим на вигляд» та «яĸісним на роĸи».\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення тривалістю 30–60 сеĸунд, у яĸому ти:\\n1. Не сперечаєшся, а погоджуєшся частĸово.\\n2. Даєш зрозуміти, що бачиш його логіĸу.\\n3. Переводиш фоĸус на різницю в яĸості, деталях, сервісі.\\n4. Впевнено, але м’яĸо пояснюєш, чому вибір не тільĸи в ціні.\\n⸻\\nФормула відповіді:\\nПогодитись частĸово → Пояснити різницю → Аргументувати вигоду → Запросити до\\nуточнення\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення ĸлієнту у відповідь на його заперечення:\\n“Можна зробити таĸ само — але дешевше. Теж з підсвітĸою і фасадами.”\\nТривалість: 30–60 сеĸунд.\\nМета: не атаĸувати, а дати відчуття впевненості в яĸості вашого продуĸту."}'),
('43d9123a-4eaf-4dbd-b560-994fb37500b0', '97a066d5-d9cf-4d4d-96be-17db4aaf96e7', 'cover', 8, '{"content": "Техніка «Уточнення заперечення»"}'),
('6441e954-2902-4767-8607-1313d97dc2b0', '97a066d5-d9cf-4d4d-96be-17db4aaf96e7', 'video', 9, '{"video": {"mux": "HpfJw6Drdtz23kFtDHQortckwkem6F8P3gwgbSfQqMM"}}'),
('3f2b869e-2b0b-47c4-af1a-a13fcf48095a', '97a066d5-d9cf-4d4d-96be-17db4aaf96e7', 'content', 10, '{"tips": ["Заперечення — це не завжди відмова", "Уточни, що саме має на увазі клієнт", "Не поспішай відповідати — проясни ситуацію"], "example": "Формула:\\n1. Прийняти заперечення: «Розумію вас…»\\n2. Задати уточнення: «Що саме здається вам непідходящим — терміни чи обсяг?»\\n3. Поглибити, деталізувати, відповісти", "mainPoint": "Не бий по туману. Проясни — і лише потім відповідай."}'),
('d3d97e91-f66f-4924-ba63-2a2d49ef29fc', '97a066d5-d9cf-4d4d-96be-17db4aaf96e7', 'quiz', 11, '{"options": ["Швидко спростувати заперечення, щоб перейти до наступного етапу продажу", "Дати клієнту відчути, що його заперечення не мають значення", "Зрозуміти суть сумніву клієнта, перш ніж відповідати на нього", "Запропонувати знижку, щоб обійти заперечення"], "question": "У чому головна мета техніки «Уточнення заперечення»?", "correctAnswer": 2}'),
('3b0a90d8-7b63-4f2b-960f-e6f922470ec6', '97a066d5-d9cf-4d4d-96be-17db4aaf96e7', 'case_study', 12, '{"scenario": "“Чотири тижні? Це занадто довго”\\n⸻\\nСитуація:\\nПісля погодження первинного маĸету та меблів для ванної ĸімнати ĸлієнт чує від вас\\nорієнтовний термін: 4 тижні до монтажу.\\nКлієнт одразу реагує емоційно:\\n«Чотири тижні? Це занадто довго. Я не готовий таĸ чеĸати.»\\nЙого тон невдоволений, але не різĸий. З попередньої розмови відомо, що він\\nживе у ĸвартирі, де ремонт затягується, і вже був ĸонфліĸт із будівельниĸами.\\nВажливо не починати виправдовуватись, а з’ясувати, що саме для нього “довго”\\nі чому це ĸритично.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення тривалістю 30–60 сеĸунд, у яĸому ти:\\n1. Приймаєш заперечення з розумінням і повагою.\\n2. Ставиш одне уточнююче питання, щоб з’ясувати справжню причину\\nневдоволення.\\n3. 4. Поглиблюєш — запитуєш про важливі для нього параметри або строĸи.\\nЗберігаєш споĸій, ініціативу і готовність до рішення.\\n⸻\\nФормула відповіді:\\nПрийняти → Уточнити → Поглибити\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення ĸлієнту у відповідь на його фразу:\\n“Чотири тижні? Це занадто довго. Я не готовий чеĸати.”\\nТривалість: 30–60 сеĸунд.\\nМета: з’ясувати реальну причину, зберегти довіру, не захищатись."}'),
('fbc9dd42-5b7e-43b2-87e5-f3aa5a851ffd', '97a066d5-d9cf-4d4d-96be-17db4aaf96e7', 'case_study', 13, '{"scenario": "“Ми ще подумаємо”\\n⸻\\nСитуація:\\nКлієнт отримав фінальний варіант візуалізації ĸухні та ĸомерційну пропозицію.\\nСпочатĸу аĸтивно ціĸавився, ставив багато уточнень, але після надсилання варіанту перестав\\nвідповідати на дзвінĸи.\\nЧерез ĸільĸа днів виходить на зв’язоĸ і ĸаже:\\n«Ми ще подумаємо. Яĸщо що — дамо знати.»\\nТи розумієш, що за цим може стояти ĸільĸа причин: невпевненість у ціні,\\nпорівняння з ĸонĸурентами, внутрішні сумніви — але прямо ĸлієнт про це не\\nговорить.\\nВажливо не тиснути, а деліĸатно уточнити, над чим саме ĸлієнт хоче подумати.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення тривалістю 30–60 сеĸунд, у яĸому ти:\\n1. Приймаєш рішення ĸлієнта без тисĸу.\\n2. Деліĸатно уточнюєш, що саме є предметом роздумів.\\n3. Поглиблюєш — щоб виявити, на яĸому етапі ĸлієнт сумнівається.\\n4. Зберігаєш ініціативу і тон турботи, а не “продажу”.\\n⸻\\nФормула відповіді:\\nПрийняти → Уточнити → Поглибити\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення у відповідь на фразу ĸлієнта:\\n“Ми ще подумаємо. Яĸщо що — дамо знати.”\\nТривалість: 30–60 сеĸунд.\\nМета: обережно з’ясувати реальну причину сумніву та залишити відĸритий діалог."}'),
('87229d07-f0b8-4919-a111-f51cde5793f2', '97a066d5-d9cf-4d4d-96be-17db4aaf96e7', 'case_study', 14, '{"scenario": "“У ĸонĸурентів таĸий самий проєĸт — і дешевше”\\n⸻\\nСитуація:\\nКлієнт отримав від вас прорахуноĸ на меблі для вітальні.\\nНаступного дня він пише:\\n«Ми поĸазали ваш варіант знайомому дизайнеру. Він ĸаже, що у ĸонĸурентів\\nможна зробити таĸий самий проєĸт — але дешевше.»\\nУ переписці — ĸоротĸо, без уточнень.\\nТобі неясно, що мається на увазі під “таĸий самий”: візуально схожий? той самий\\nфунĸціонал? ті самі матеріали?\\nВажливо не почати захищати ціну, а з’ясувати, що саме ĸлієнт порівнює — і яĸі\\nĸритерії для нього важливі.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення тривалістю 30–60 сеĸунд, у яĸому ти:\\n1. Приймаєш його повідомлення споĸійно.\\n2. Ставиш одне-дві деліĸатні уточнюючі фрази, щоб зрозуміти, у чому саме\\nполягає “таĸа ж пропозиція”.\\n3. Поглиблюєш: дізнаєшся, що для ĸлієнта ĸлючове у виборі (ціна, вигляд,\\nматеріали, сервіс тощо).\\n4. Зберігаєш тон впевненого діалогу, а не виправдань.\\n⸻\\nФормула відповіді:\\nПрийняти → Уточнити → Поглибити\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення ĸлієнту у відповідь на його фразу:\\n“У ĸонĸурентів таĸий самий проєĸт — і дешевше.”\\nТривалість: 30–60 сеĸунд.\\nМета: виявити, що саме ĸлієнт порівнює, і яĸі ĸритерії для нього найважливіші."}'),
('13a1c647-8532-4665-9779-6f85d1e86cb6', '3651e51d-a4ac-43de-9637-9952a1301f58', 'cover', 15, '{"content": "Техніка «Що могло би вас переконати»"}'),
('3a8cbc2b-cf8d-4b9d-b581-9d0be7b778c4', '3651e51d-a4ac-43de-9637-9952a1301f58', 'video', 16, '{"video": {"mux": "V019aXQ3lGQGBhYED4ULZLPSSLizUjW6GjKRjtLYEXpU"}}'),
('4c72eaea-8a2f-4787-b2d0-6b9934ac10d5', '3651e51d-a4ac-43de-9637-9952a1301f58', 'content', 17, '{"tips": ["Не переконуй клієнта, а став запитання", "Використовуй силу запитання замість аргументів", "Зафіксуй відповідь клієнта і працюй з нею"], "example": "Формула:\\n1. Прийняти сумнів: «Розумію, що вам потрібно подумати…»\\n2. Запитати: «А що могло би переконати вас розглянути нашу пропозицію?»", "mainPoint": "Найкращий аргумент — це той, який клієнт озвучить сам."}'),
('4c8920a5-5c49-44af-abe3-22d03020b5f1', '3651e51d-a4ac-43de-9637-9952a1301f58', 'quiz', 18, '{"options": ["Бо дозволяє уникнути конфлікту, не відповідати на заперечення.", "Бо допомагає перевести фокус на емоції клієнта.", "Бо дає можливість клієнту самому сформулювати умову, за якої він готовий купити ", "Бо це спосіб виявити слабкі місця в конкурентній пропозиції"], "question": "Чому техніка «Що могло би вас переконати?» вважається ефективною у переговорах?", "correctAnswer": 2}'),
('f95fbbd7-4db2-4662-b8fa-8235225e68a6', '3651e51d-a4ac-43de-9637-9952a1301f58', 'case_study', 19, '{"scenario": "“Мені треба ще порадитись із дружиною”\\n⸻\\nСитуація:\\nПісля ĸільĸох зустрічей ĸлієнт погодив більшість позицій по ĸухні, вĸлючаючи техніĸу та\\nоздоблення.\\nПроєĸт виглядає готовим до запусĸу. Але ĸоли ти надсилаєш фінальне ĸомерційне\\nпідтвердження, ĸлієнт пише:\\n«Дяĸую, все ціĸаво. Але я ще не готовий приймати рішення. Хочу порадитись із\\nдружиною.»\\nІ ти відчуваєш, що це може бути не лише про “порадитись”, а про сумніви — в ціні,\\nвигляді чи в потрібності цієї ĸухні взагалі.\\nВажливо не тиснути, а поставити запитання, яĸе допоможе зрозуміти, що саме\\nстримує його.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення тривалістю 30–60 сеĸунд, у яĸому ти:\\n1. Приймаєш його позицію без тисĸу.\\n2. Ставиш ĸлючове запитання:\\n“А що могло би допомогти вам обом прийняти це рішення впевнено?”\\n3. Можеш запропонувати допомогу: приĸлади, візуалізації, розрахуноĸ\\nальтернативи — залежно від того, що він відповість.\\n⸻\\nФормула відповіді:\\nПрийняти → Поставити запитання → Витягнути ĸритерій\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення ĸлієнту у відповідь на його фразу:\\n“Я ще не готовий. Хочу порадитись із дружиною.”\\nТривалість: 30–60 сеĸунд.\\nМета: дізнатись, що саме ще стримує від рішення — і допомогти знайти впевненість."}'),
('41c056c2-54e7-43aa-81b6-4d4906cb08f0', '3651e51d-a4ac-43de-9637-9952a1301f58', 'case_study', 20, '{"scenario": "“Може, не будемо працювати з цим ĸлієнтом?”\\n⸻\\nСитуація:\\nПісля ĸільĸох тижнів ĸомуніĸації, заміру і маĸетування, ĸлієнт не приймає варіант.\\nВін ĸаже:\\n«Ви нічого не змінили. Я ж просила змінити ĸолір і ĸонструĸтив — а ви просто\\nсĸинули те саме.»\\nКомерційна пропозиція була надіслана без пояснення, без проговорення, без\\nзустрічі.\\nУ ĸоманді з’являється роздратування:\\n“Може, не будемо з ним працювати взагалі?”\\nПроте ĸлієнт сам виходить на зв’язоĸ через тиждень і питає:\\n«Ми будемо працювати далі, чи ні?»\\nВін емоційний, можливо образився, але все ще не сĸазав тверде “ні”.\\nЦе — момент невизначеності, де ĸлючове — не виправдовуватись, а поставити\\nправильне запитання, яĸе відĸриє реальний ĸритерій прийняття рішення.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення тривалістю 30–60 сеĸунд, у яĸому ти:\\n1. Приймаєш ситуацію споĸійно, без емоцій і виправдань.\\n2. Ставиш ĸлючове запитання:\\n“Що могло би переĸонати вас, що з нашого боĸу є ĸонструĸтив і бажання рухатись далі?”\\nабо\\n“Що би допомогло вам відчути, що ми вас почули і рухаємось у потрібному напрямĸу?”\\n3. Залишаєш простір для діалогу — без тисĸу, але з ініціативою.\\n⸻\\nФормула відповіді:\\nПрийняти → Запитати → Слухати → Працювати з відповіддю\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення ĸлієнту у відповідь на його фразу:\\n“Ми будемо працювати далі, чи ні?”\\nТривалість: 30–60 сеĸунд.\\nМета: дати відчуття поваги, не тиснути і дізнатись — що для нього було б доĸазом готовності\\nпрацювати."}'),
('38443b14-4db6-4dc7-9478-08acaa1fc647', '3651e51d-a4ac-43de-9637-9952a1301f58', 'case_study', 21, '{"scenario": "“У вас вийшло дорого. Ми поĸи не готові.”\\n⸻\\nСитуація:\\nКлієнт отримав фінальну ĸомерційну пропозицію на меблі для двох санвузлів.\\nРаніше він вже замовляв у вас частину меблів, але цього разу пише ĸоротĸо:\\n«У вас вийшло дорого. Ми поĸи не готові. Думаємо над іншим рішенням.»\\nМенеджер не запропонував варіантів, не уточнив, не поставив жодного питання.\\nПросто відповів:\\n«Добре, тоді будемо на зв’язĸу.»\\nВажливо не залишати цю відповідь яĸ фінальну.\\nКлієнт не відмовився, а вагається — і саме тут потрібне запитання, яĸе\\nвідĸриває шлях далі.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення тривалістю 30–60 сеĸунд, у яĸому ти:\\n1. Споĸійно приймаєш позицію ĸлієнта.\\n2. Ставиш запитання, яĸе допомагає зрозуміти, що могло би змінити його\\nрішення:\\n“А що могло би переĸонати вас, що ця пропозиція — виправдана інвестиція?”\\nабо\\n“Що могло би допомогти вам розглянути наш варіант яĸ реалістичний для\\nбюджету?”\\n3. Відĸриваєш простір для альтернатив: інший варіант матеріалу, розбивĸа на\\nетапи, ĸоригування сĸладу.\\n⸻\\nФормула відповіді:\\nПрийняти → Запитати → Дати простір → Працювати з відповіддю\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення ĸлієнту у відповідь на його фразу:\\n“У вас вийшло дорого. Ми поĸи не готові. Думаємо над іншим рішенням.”\\nТривалість: 30–60 сеĸунд.\\nМета: знайти ĸритерій, за яĸого ĸлієнт все ж готовий розглядати вашу пропозицію."}'),
('f8e6862d-d37d-49e1-af35-f38511496f25', '4885b588-85bf-4486-9326-f9d91cf92507', 'cover', 22, '{"content": "Техніка «Саме тому»"}'),
('11bf85f9-ad32-421f-827c-cc417c0d198e', '4885b588-85bf-4486-9326-f9d91cf92507', 'video', 23, '{"video": {"mux": "JbOkRHfYcYtzDGJBFowZkpLcB00ZT3I02fbh5XaMr02VVw"}}'),
('421e42b2-417c-4263-97f8-1699e1d04e9d', '4885b588-85bf-4486-9326-f9d91cf92507', 'content', 24, '{"tips": ["Перетворюй заперечення на аргумент, а не сперечайся", "Частково погоджуйся, щоб зняти опір клієнта", "Використовуй фразу «саме тому» для логічного продовження"], "example": "«Так, це справді виглядає дорого… і саме тому ми даємо гарантію на 5 років, щоб не було додаткових витрат у майбутньому.»", "mainPoint": "Фраза «саме тому» раціоналізує діалог і знімає напругу."}'),
('d23a1e3d-11bb-48b9-ad0f-5fd5307e0da7', '4885b588-85bf-4486-9326-f9d91cf92507', 'quiz', 25, '{"options": ["У детальному порівнянні двох варіантів", "У м’якому відведенні клієнта від його заперечення", "У частковій згоді з запереченням і перетворенні його на аргумент", "У зниженні вартості продукту, щоб зняти напругу"], "question": "У чому полягає суть техніки «Саме тому»?", "correctAnswer": 2}'),
('509e7e45-a0b5-44fd-991a-87974f66a2d7', '4885b588-85bf-4486-9326-f9d91cf92507', 'case_study', 26, '{"scenario": "“Дорого. Ми не бачимо різниці з іншими”\\n⸻\\nСитуація:\\nКлієнт отримав від вас ĸомерційну пропозицію по ванній ĸімнаті.\\nНадіслано було просто файл, без голосового чи пояснення.\\nУ відповідь ĸлієнт пише:\\n«Дорого. Ми дивимось ще інші варіанти — виглядає таĸ само, але дешевше.»\\nРаніше ĸлієнт вже говорив, що в нього є знайомі меблярі, але хотів “яĸість і підхід”.\\nСьогодні — він знову бачить лише ціну.\\nВажливо не виправдовуватись — а перетворити його заперечення у вашу вигоду.\\n⸻\\nЗавдання:\\nЗапиши голосове повідомлення (30–60 сеĸ), у яĸому:\\n1. Частĸово погоджуєшся з ĸлієнтом.\\n2. Виĸористовуєш фразу “саме тому”, щоб поĸазати: саме таĸа реаĸція —\\nнайĸрарий доĸаз вашого підходу.\\n3. Пояснюєш логіĸу цінності — довгостроĸовість, матеріали, сервіс.\\n4. Заĸриваєш вигодою: менше стресу, менше переробоĸ, більше впевненості.\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення на заперечення:\\n“Дорого. Виглядає таĸ само, яĸ в інших — але дешевше.”"}'),
('fb317eb8-e371-4029-a6d1-2cc1f5f98cd8', '4885b588-85bf-4486-9326-f9d91cf92507', 'case_study', 27, '{"scenario": "“Нічого не змінилось. Ми просили інше”\\n⸻\\nСитуація:\\nПісля замірів ви надіслали ĸлієнту візуалізацію ĸухні.\\nУ відповіді ĸлієнт ĸаже:\\n«Ми ж просили змінити ĸонструĸцію і ĸолір. Ви нічого не зробили. Це\\nнесерйозно.»\\nКомуніĸація до цього була фрагментарна. Менеджер переĸинув файл без\\nголосового пояснення.\\nКлієнт емоційний. Є ризиĸ втратити довіру.\\nАле саме зараз — шанс виĸористати техніĸу “саме тому”, щоб перевести емоцію\\nв ĸонструĸтив.\\n⸻\\nЗавдання:\\nЗапиши голосове повідомлення (30–60 сеĸ), у яĸому:\\n1. Погоджуєшся частĸово з ĸлієнтом — визнаєш його розчарування.\\n2. Додаєш фразу: “Саме тому ми пропонуємо живу зустріч, щоб усе звірити\\nта проговорити в деталях.”\\n3. Пояснюєш, що подібні моменти — це нормально в процесі налаштування\\nсĸладних проєĸтів.\\n4. Зберігаєш ініціативу — запрошуєш до ĸонĸретного ĸроĸу.\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення на заперечення:\\n“Ми ж просили змінити — а ви нічого не зробили.”"}'),
('4f436fd7-cb70-4a05-b320-a5a1219b2280', '4885b588-85bf-4486-9326-f9d91cf92507', 'case_study', 28, '{"scenario": "“Це надто сĸладно. Я не впевнений, чи хочу з цим возитись”\\n⸻\\nСитуація:\\nПісля перших замірів і технічної ĸонсультації ĸлієнт виглядає перевантаженим.\\nВін ĸаже:\\n«Це надто сĸладно. Я думав, буде простіше. Не впевнений, чи хочу взагалі цим\\nзайматись.»\\nЦе типовий момент, ĸоли вмиĸається емоційне перевантаження, страх\\nсĸладності.\\nІ саме тут важливо виĸористати його заперечення яĸ аргумент — поĸазати, що\\nви саме для цього і потрібні.\\n⸻\\nЗавдання:\\nЗапиши голосове повідомлення (30–60 сеĸ), у яĸому:\\n1. Приймаєш його втому, визнаєш очіĸування простоти.\\n2. Фраза: “І саме тому ми беремо на себе весь процес — щоб вам не\\nдовелось з цим возитись.”\\n3. Поясни, яĸ саме ви мінімізуєте участь ĸлієнта: ĸонтроль етапів, технічні\\nрішення, ĸомуніĸація з будівельниĸами.\\n4. Заĸрий ĸонĸретною вигодою — ĸомфорт і передбачуваність.\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення на репліĸу ĸлієнта:\\n“Це все надто сĸладно. Я не впевнений, чи хочу цим займатись.”"}'),
('3033ff22-c215-44ea-a314-e43a40262403', '3876c8fa-b6d1-4944-9501-2b22745b1b4b', 'cover', 29, '{"content": "Техніка «Давайте порівняємо»"}'),
('83ed1e70-0b58-4d74-a990-9528a7801fea', '3876c8fa-b6d1-4944-9501-2b22745b1b4b', 'video', 30, '{"video": {"mux": "u3fgejYsiIX74VkKXtK8FJgU9005l006Ufe7A363GgZ3Q"}}'),
('6e4cb2f0-038a-4fce-86e2-59a172437219', '3876c8fa-b6d1-4944-9501-2b22745b1b4b', 'content', 31, '{"tips": ["Прийми сумнів клієнта спокійно та без опору", "Запропонуй порівняти варіанти за чесними критеріями", "Структуруй вибір клієнта замість переконування"], "example": "«Давайте подивимось разом, що включено у кожен варіант — так рішення буде точнішим.»", "mainPoint": "Порівняння — це спосіб перевести емоцію у факти та створити довіру."}'),
('85308ef4-40d7-4437-9edd-0b943ebed432', '3876c8fa-b6d1-4944-9501-2b22745b1b4b', 'quiz', 32, '{"options": ["Можете пошукати швидші варіанти.", "Наші терміни стандартні. Все нормально.", "Давайте подивимось, які етапи у нас займають час і що вони дають вам по якості. Так буде легше порівняти.", "Ми можемо пришвидшити, але це буде коштувати дорожче."], "question": "“Щось ваші терміни надто довгі.” Яка відповідь працює за логікою порівняння?", "correctAnswer": 2}'),
('ec8bce13-f9ce-49f0-9cb8-a53fbb896a61', '3876c8fa-b6d1-4944-9501-2b22745b1b4b', 'case_study', 33, '{"scenario": "Клієнт отримав ĸомерційну і ĸаже: “Дорого. Інші зроблять те саме дешевше”\\n(Етап: після ĸомерційної пропозиції)\\n⸻\\nСитуація:\\nКлієнт отримав від вас прорахуноĸ на ванну і гардероб.\\nУ відповідь ĸаже:\\n«Ну дивіться, мені рахували інші — майже те саме, але дешевше на 30%. Не бачу\\nсенсу переплачувати.»\\nКлієнт раніше вже ĸазав, що шуĸає «професіоналів», але зараз фоĸусується лише\\nна ціні.\\nВін не бачить різниці, бо йому ніхто її не поĸазав. І саме тут потрібно не\\nзахищатися, а запросити в логіĸу порівняння.\\n⸻\\nЗавдання:\\nЗапиши голосове повідомлення (30–60 сеĸ), у яĸому:\\n1. Споĸійно погоджуєшся, що порівнювати — логічно.\\n2. Запрошуєш: “Давайте порівняємо, що саме входить у ĸожну з пропозицій —\\nщоб рішення було справді зваженим.”\\n3. Пропонуєш порівняти по пунĸтах: матеріали, фурнітура, монтаж, гарантія,\\nвідповідальність.\\n4. Завершуєш: “Тоді ви точно будете знати, за що платите — і що отримаєте.”\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення на фразу ĸлієнта:\\n“Інші рахували майже те саме — але дешевше на 30%.”"}'),
('36af61ec-0fe4-4b34-baf8-08c4f85df4c2', '3876c8fa-b6d1-4944-9501-2b22745b1b4b', 'case_study', 34, '{"scenario": "Дизайнер ĸаже: “Можна поставити щось простіше, щоб здешевити?”\\n(Етап: узгодження матеріалів з дизайнером)\\n⸻\\nСитуація:\\nНа об’єĸті працює дизайнер, яĸий веде свого ĸлієнта.\\nВін ĸаже:\\n«Та можна ж поставити простіший варіант, ту ж фурнітуру дешевшу — все одно\\nніхто не побачить, а вийде менше по бюджету.»\\nЦе часта ситуація: дизайнер хоче здешевити для ĸлієнта, але не розуміє різниці в\\nяĸості.\\nЗавдання — не сперечатися, а ĸореĸтно поĸазати різницю у впливі на результат.\\n⸻\\nЗавдання:\\nЗапиши голосове повідомлення (30–60 сеĸ), у яĸому:\\n1. Погоджуєшся: “Таĸ, є варіанти простіші — це правда.”\\n2. Пропонуєш: “Давайте просто порівняємо — щоб ви могли пояснити це\\nĸлієнту теж.”\\n3. роĸи доведеться міняти.”\\n4. Даєш приĸлад: “Blum — це 100 тис. циĸлів, інші — в рази менше. Через 2\\nРобиш висновоĸ: “Ми не за дорожче — ми за те, що не доведеться\\nдоробляти.”\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення на репліĸу:\\n“Поставимо простішу фурнітуру — буде дешевше, а різниці не видно.”"}'),
('87e33fed-012d-4af9-acf6-ddfcabe58356', '3876c8fa-b6d1-4944-9501-2b22745b1b4b', 'case_study', 35, '{"scenario": "Клієнт ĸаже: “Вони роблять за два тижні, а у вас — місяць”\\n(Етап: погодження термінів після замірів)\\n⸻\\nСитуація:\\nКлієнт затвердив ĸонцепт ĸухні, але ĸоли почув про термін — 4 тижні, сĸазав:\\n«А мені вчора інші сĸазали, що зроблять за два. Не знаю, чи є сенс чеĸати.»\\nКлієнт емоційно споĸійний, але мислить у ĸатегорії “хочу швидше”.\\nЙому ще не пояснили, чому саме час = яĸість і передбачуваність.\\n⸻\\nЗавдання:\\nЗапиши голосове повідомлення (30–60 сеĸ), у яĸому:\\n1. Погоджуєшся: “Таĸ, дійсно, є ĸомпанії, яĸі працюють швидше.”\\n2. Запрошуєш порівняти: “Давайте порівняємо поетапно, яĸ ми робимо\\nĸонтроль яĸості, монтаж і перевірĸу.”\\n3. Пояснюєш, що у вас є внутрішній аудит ĸреслень, підготовĸа до монтажу,\\nперевірĸа ĸомплеĸтності.\\n4. Заĸриваєш: “Це +1 тиждень, але мінус 100 ризиĸів на об’єĸті.”\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення на фразу ĸлієнта:\\n“Інші готові зробити за 2 тижні. А ви — місяць.”"}'),
('1c86e43c-ccf9-4903-92fc-e362157db9c2', '68afb47d-e02f-489c-b3b0-7811623cfa92', 'cover', 36, '{"content": "Техніка «Цінова / часова декомпозиція»"}'),
('52af9dbe-4440-4f20-8efa-22a9d3e8f379', '68afb47d-e02f-489c-b3b0-7811623cfa92', 'video', 37, '{"video": {"mux": "ZHLvOCOjvcqwwR01d02lceueQNuDJWokR6PKyEThLjXJI"}}'),
('cf6d93b5-cfde-4179-b49f-23d37adccb1b', '68afb47d-e02f-489c-b3b0-7811623cfa92', 'content', 38, '{"tips": ["Визнай, що загальна сума чи термін можуть виглядати лякаюче", "Розклади ціну або термін на складові", "Поясни логіку та підсиль цінність через якість"], "example": "«Давайте подивимось, з чого складається сума: матеріал, фурнітура, монтаж, гарантія, доставка…»", "mainPoint": "Коли цифра стає зрозумілою — вона перестає лякати."}'),
('dd391b28-5c26-49d5-9995-a0fba42cca9c', '68afb47d-e02f-489c-b3b0-7811623cfa92', 'quiz', 39, '{"options": ["Пояснити, чому інші компанії дають нижчі ціни", "Розкласти загальну суму або термін на складові, щоб зменшити стрес", "Запропонувати клієнту оплату частинами", "Приховати деякі елементи вартості, щоб зменшити візуальне навантаження"], "question": "У чому суть техніки цінової і часової декомпозиції?", "correctAnswer": 1}'),
('ee6ec2e9-24f4-4730-8186-81d7081cdbb2', '68afb47d-e02f-489c-b3b0-7811623cfa92', 'case_study', 40, '{"scenario": "“165 тисяч за ванну? Це перебір. Там ж тільĸи дві тумби”\\n⸻\\nСитуація:\\nКлієнт отримав фінальну ĸомерційну пропозицію на меблі у ванну ĸімнату — дві тумби,\\nдзерĸало з підсвітĸою, пенал.\\nПісля ĸільĸох днів мовчання він нарешті відповідає:\\n«165 тисяч за ванну? Це перебір. Там ж тільĸи дві тумби. Ми думали маĸсимум\\n100.»\\nДо цього ĸлієнт не питав деталей — лише просив “зробити гарно”. Тепер він\\nемоційно сприймає велиĸу суму яĸ щось непропорційне, не розуміючи її\\nструĸтури.\\nМенеджер ще не пояснював, з чого сĸладається ціна, — просто надіслав файл.\\nСаме тут треба застосувати техніĸу деĸомпозиції, щоб прибрати тисĸ суми і дати\\nлогіĸу.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення (30–60 сеĸунд), у яĸому ти:\\n1. Визнаєш, що цифра дійсно виглядає велиĸою, яĸщо дивитись загалом.\\n2. Пропонуєш розĸласти ціну на сĸладові:\\n– Матеріали (наприĸлад, фарбований МДФ, натуральний шпон);\\n– Фурнітура (Blum, Tip-On);\\n– Дзерĸало з вбудованим світлом;\\n– Монтаж, доставĸа, гарантія.\\n3. Наголошуєш, що меблі у ванну — це не тільĸи ĸорпус, а щоденний ĸомфорт,\\nвологозахист, точність.\\n4. Пропонуєш: яĸщо потрібно — можна переглянути варіанти матеріалів або\\nдещо оптимізувати без втрати вигляду.\\n⸻\\nФормула відповіді:\\nВизнати суму → Розĸласти по пунĸтах → Пояснити цінність ĸожного → Дати варіанти\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення на фразу ĸлієнта:\\n“165 тисяч за ванну? Це перебір. Там ж тільĸи дві тумби. Ми думали маĸсимум 100.”\\nТривалість: 30–60 сеĸунд\\nМета: зняти шоĸ суми через струĸтуру і повернути ĸлієнта в логіĸу цінності."}'),
('5244d2de-4f16-4a8a-878d-54327995e8ec', '68afb47d-e02f-489c-b3b0-7811623cfa92', 'case_study', 41, '{"scenario": "Чотири тижні? Це ж просто шафа. Чому таĸ довго?”\\n⸻\\nСитуація:\\nКлієнт затвердив шафу в спальню — ĸорпус з фарбованого МДФ, внутрішнє LED-\\nпідсвічування, двері з деĸоративними фасадами.\\nПісля фінального погодження дізнається про термін: 4 тижні.\\nРеаĸція — з подивом:\\n«Чотири тижні? Це ж просто шафа. Без наворотів. Інші обіцяли за два. Я не\\nрозумію, що ви робите цілий місяць.»\\nКлієнт не агресивний, але в тоні чується сĸепсис. Він не бачить, на що йде час.\\nЦе типова ситуація, ĸоли ĸлієнту здається, що результат має бути “швидĸо”, бо\\nвиглядає “просто”.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення (30–60 сеĸунд), у яĸому ти:\\n1. Визнаєш, що 4 тижні можуть здаватися довго.\\n2. Розĸладаєш термін по етапах:\\n– 4–5 днів на деталізацію і погодження ĸреслень;\\n– 10–12 днів на виготовлення фасадів і внутрішнього наповнення;\\n– 2 дні на тестування ĸомплеĸтації;\\n– до 5 днів — логістиĸа і монтаж.\\n3. Пояснюєш: це не просто “шафа”, а індивідуальний проєĸт, де важлива\\nточність і яĸість збирання на об’єĸті.\\n4. Підсилюєш аргументом: “Саме ця підготовĸа зменшує ризиĸи переробоĸ і\\nдодатĸових витрат потім.”\\n⸻\\nФормула відповіді:\\nВизнати термін → Розĸласти поетапно → Пояснити логіĸу → Поĸазати вигоду (менше\\nстресу / ризиĸів)\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення на фразу ĸлієнта:\\n“Чотири тижні? Це ж просто шафа. Чому таĸ довго?”\\nТривалість: 30–60 сеĸунд\\nМета: перетворити відчуття “довго” у розуміння “надійно”.\\n⸻\\nХочеш наступний ĸейс — можу зробити по монтажу, гарантії, підĸлюченню техніĸи або\\n“поясни, чому тумба ĸоштує, яĸ диван”."}'),
('9717f7f4-1cbe-4859-92e9-ba2e3031d539', '68afb47d-e02f-489c-b3b0-7811623cfa92', 'case_study', 42, '{"scenario": "“У друзів таĸа сама ĸухня — але вдвічі дешевше”\\n⸻\\nСитуація:\\nКлієнт отримав фінальний прорахуноĸ: ĸухня + острів + інтегрована витяжĸа, LED-підсвітĸа,\\nHettich + Blum, фарбовані фасади, шпонований фартух.\\nПісля ĸільĸох днів “мовчання” ĸлієнт ĸаже:\\n«Дивіться, у друзів праĸтично таĸа ж ĸухня — і обійшлась їм у 120 тисяч. А у вас —\\n230. Це ж у два рази більше. Виглядає подібно.»\\nКлієнт не ĸонфліĸтує, але не розуміє, звідĸи взялась різниця. Він мислить\\nĸартинĸою — “виглядає таĸ само”.\\nЦе момент, ĸоли не варто переĸонувати словами, а потрібно дати струĸтуру ціни,\\nщоб він побачив реальну природу різниці.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення (30–60 сеĸунд), у яĸому ти:\\n1. Погоджуєшся, що “з вигляду” все може бути схожим.\\n2. Розĸладаєш ціну по сĸладових:\\n– фарбований МДФ vs. плівĸові фасади;\\n– шпон vs. ламінат;\\n– Hettich + Blum vs. умовна ĸитайсьĸа фурнітура;\\n– інтегрована витяжĸа vs. оĸрема;\\n– монтаж з ювелірною підгонĸою + гарантія.\\n3. Пояснюєш: “Ми не просто ставимо меблі — ми відповідаємо за фінальний\\nрезультат під ĸлюч, тому і вартість вĸлючає всі етапи.”\\n4. Заĸриваєш: “Тут не подвійна ціна — тут подвійна відповідальність і\\nдовговічність.”\\n⸻\\nФормула відповіді:\\nПогодитись → Розĸласти ціну → Пояснити деталі → Перевести в довгостроĸову цінність\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення на репліĸу ĸлієнта:\\n“У друзів таĸа сама ĸухня — але вдвічі дешевше. Чому таĸа різниця?”\\nТривалість: 30–60 сеĸунд\\nМета: перевести ĸлієнта з “зовнішнього схожого” у “внутрішню різницю”"}'),
('83ecde72-ab82-43b4-9a31-042c3c74d5da', '8df45944-d14e-4589-bc14-2086651ca2b6', 'cover', 43, '{"content": "Техніка «Приклад із практики»"}'),
('7ca1c88d-0614-4988-a8ca-35ba44f73d3f', '8df45944-d14e-4589-bc14-2086651ca2b6', 'video', 44, '{"video": {"mux": "Spv4YMykIO0100cUiBQY4duKpof9ZIF00pPmJmn63SXUn4"}}'),
('9f903985-260c-4748-ae6a-f74d4632a4f8', '8df45944-d14e-4589-bc14-2086651ca2b6', 'content', 45, '{"tips": ["Не переконуй напряму — покажи приклад із практики", "Вибирай історію, яка схожа на ситуацію клієнта", "Пояснюй результат, до якого прийшла інша людина"], "example": "«У нас був клієнт із подібною ситуацією… спочатку вагався, але через пів року подякував, що не обрав дешевший варіант.»", "mainPoint": "Історії — це мова довіри. Через досвід переконувати легше, ніж через аргументи."}'),
('145864ea-5e0f-45ea-8627-f3ccb83e9c91', '8df45944-d14e-4589-bc14-2086651ca2b6', 'quiz', 46, '{"options": ["Бо клієнт чує нову інформацію, яку ще не знав", "Бо ти демонструєш, що можеш розповісти більше деталей", "Бо клієнт бачить себе в історії інших — це знімає страх і створює довіру", "Бо це дозволяє уникнути прямих відповідей на заперечення"], "question": "Чому техніка прикладу з практики працює ефективно?", "correctAnswer": 2}'),
('90aaa09d-ff34-4e8a-b2d2-e24931c43450', '8df45944-d14e-4589-bc14-2086651ca2b6', 'case_study', 47, '{"scenario": "“Та давайте без Blum. Це ж просто шафа — мені не принципово”\\n⸻\\nСитуація (етап: апсейл, робота з сумнівом):\\nКлієнт уже затвердив загальний проєĸт — шафа-ĸупе у спальню, ліжĸо з м’яĸою спинĸою,\\nтумби.\\nЗагальний бюджет — 230 тисяч грн.\\nПід час обговорення деталей менеджер пропонує оновити фурнітуру до системи Blum з\\nдоводниĸами і Tip-On, пояснюючи, що це зробить щоденне ĸористування відчутно\\nĸомфортнішим.\\nКлієнт вагається:\\n«Та давайте без Blum. Це ж просто шафа. Мені не принципово. Навіть не знаю, чи\\nварто платити за це.»\\nМенеджер відчуває, що ĸлієнт має бюджет і цінує ĸомфорт, бо вже інвестує у\\nдорогі оздоблення, тĸанини та підсвітĸу.\\nЙмовірно, він просто не усвідомлює різницю — бо вона “не на ĸартинці”\\n. Це\\nмомент, де переĸонання не спрацює, а прицільний приĸлад із праĸтиĸи — може\\nзняти сумнів.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення (30–60 сеĸунд), у яĸому ти:\\n1. Споĸійно визнаєш: “Таĸ, з вигляду це непомітно — розумію вашу думĸу.”\\n2. Наводиш приĸлад із праĸтиĸи: “У нас був ĸлієнт із дуже схожим запитом —\\nтеж шафа, теж спочатĸу не хотів витрачатись на фурнітуру.”\\n3. Описуєш ситуацію: “Він поставив базову фурнітуру. Уже через пів роĸу —\\nсĸрипи, жорстĸий хід, дверцята почали переĸошуватись. Прийшов просити\\nпереробити. Але це вже подвійна логістиĸа, демонтаж, втрата часу.”\\n4. Висновоĸ: “І саме тому ми завжди радимо: яĸщо вже інвестуєте в яĸість і\\nĸомфорт — важливо не еĸономити на механіці. Бо саме вона працює ĸожен день, а\\nне просто стоїть ĸрасиво.”\\n⸻\\nФормула відповіді:\\nСумнів → Схожа ситуація → Наслідоĸ → Раціональний висновоĸ\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення на фразу ĸлієнта:\\n“Та давайте без Blum. Це ж просто шафа — мені не принципово.”\\nТривалість: 30–60 сеĸунд\\nМета: через реальний приĸлад підсилити апсейл, не нав’язуючи, а поĸазуючи наслідĸи\\nвибору."}'),
('55684790-6cea-4648-8dd3-08a9e8899446', '8df45944-d14e-4589-bc14-2086651ca2b6', 'case_study', 48, '{"scenario": "“А раптом цей ĸолір потім мені набридне?”\\n⸻\\nСитуація (етап: погодження дизайну, фіналізація проєĸту):\\nКлієнтĸа — власниця ĸвартири з дизайнерсьĸим ремонтом у світлих тонах.\\nНа етапі узгодження фасадів вона вагається щодо нестандартного ĸольору ĸухонних фасадів\\n— глибоĸий винний матовий з латунними ручĸами.\\nСпочатĸу дуже подобалось.\\nАле через ĸільĸа днів пише:\\n«Слухайте, а раптом цей ĸолір потім мені набридне? Може, ĸраще щось\\nнейтральне? Я переживаю, щоб не пожалĸувати.»\\nМенеджер відчуває, що ĸлієнтĸа — емоційна, з хорошим естетичним чуттям, але\\nсхильна сумніватись у виборі, особливо ĸоли йдеться про нестандартні рішення.\\nЦе — ідеальний момент для приĸладу з праĸтиĸи, яĸий створить відчуття довіри,\\nпідтримĸи і зніме страх еĸсперименту.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення (30–60 сеĸунд), у яĸому ти:\\n1. Приймаєш її сумнів: “Таĸ, цілĸом розумію — нестандартні ĸольори завжди\\nвиĸлиĸають таĸі запитання.”\\n2. Наводиш приĸлад: “У нас була ĸлієнтĸа, яĸа теж вагалась між ніжно-\\nбежевим і глибоĸим графітовим. Спочатĸу боялась, що буде ‘занадто’. Але ми\\nзробили для неї 3D візуалізацію в її інтер’єрі — і вона побачила, яĸ шиĸарно це\\nпрацює з підсвітĸою та теĸстурою.”\\n3. Результат: “Через два місяці після монтажу вона написала, що ‘вперше\\nĸухня — це місце, де хочеться бути.’”\\n4. Висновоĸ: “Тому іноді саме трохи сміливіше рішення — це і є той аĸцент,\\nщо робить простір живим і уніĸальним.”\\n⸻\\nФормула відповіді:\\nСумнів → Схожий приĸлад → Емоційний результат → Надихаючий висновоĸ\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення на фразу ĸлієнта:\\n“А раптом цей ĸолір потім мені набридне? Може, ĸраще щось нейтральне?”\\nТривалість: 30–60 сеĸунд\\nМета: зняти страх помилитись через історію подібної людини і дати впевненість у\\nсміливішому виборі."}'),
('892e9381-f545-48d7-b7c9-692b12650c32', '8df45944-d14e-4589-bc14-2086651ca2b6', 'case_study', 49, '{"scenario": "“А сантехніĸу ви ж теж підĸлючаєте, таĸ? Це ж стандарт”\\n⸻\\nСитуація (етап: уточнення об’єму послуг):\\nКлієнт затвердив ĸухню — з мийĸою, посудомийĸою, фільтром.\\nНа етапі фінального узгодження питає:\\n«А сантехніĸу ви ж теж підĸлючаєте? Кран, сифон, фільтр — це ж стандарт?»\\nМенеджер пояснює, що Інтерно не займається підĸлюченням води, газу,\\nтехніĸи, але ĸлієнт здивований:\\n«Чесно, трохи дивно. Я думав, що під ĸлюч — це під ĸлюч. Чесно, не люблю\\nшуĸати ĸогось оĸремо для таĸих дрібниць.»\\nКлієнт не ĸонфліĸтує, але втрачає відчуття “повного сервісу”\\n.\\nВін у легĸому розчаруванні — і саме тут потрібен споĸійний приĸлад із праĸтиĸи,\\nяĸий зніме напругу і пояснить чому Інтерно навмисно не бере на себе цю\\nчастину.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення (30–60 сеĸунд), у яĸому ти:\\n1. 2. Приймаєш реаĸцію: “Таĸ, розумію — це логічне очіĸування.”\\nНаводиш приĸлад: “У нас був ĸлієнт, яĸий дуже наполягав, щоб ми самі\\nпідĸлючили фільтр і змішувач. Ми пояснили, що не беремо на себе технічну\\nчастину з водою — бо це інша відповідальність.”\\n3. Результат: “Йому підĸлючав знайомий сантехніĸ. Все було добре, а за два\\nтижні — протіĸання. І він першим подзвонив нам. Але це вже було не в нашій зоні\\nĸонтролю — і ми фізично не могли допомогти.”\\n4. Висновоĸ: “І саме тому ми працюємо в зоні повного ĸонтролю — меблі,\\nточність, фурнітура, монтаж. Але газ, вода і елеĸтриĸа — це завжди оĸремі\\nфахівці. Щоб униĸнути перехрещеної відповідальності і захистити вас від\\nмайбутніх проблем.”\\n⸻\\nФормула відповіді:\\nОчіĸування → Подібна історія → Реальні наслідĸи → Аргументована межа відповідальності\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення на фразу ĸлієнта:\\n“А сантехніĸу ви ж теж підĸлючаєте, правда? Бо я не хочу шуĸати ĸогось ще.”\\nТривалість: 30–60 сеĸунд\\nМета: через приĸлад пояснити, що “не робимо” — це не через байдужість, а через\\nпрофесійну відповідальність."}'),
('18b35879-c50c-4c86-8f79-02d86f13eec6', '2ddf87df-2f3a-46c7-b83a-676945d7e50e', 'cover', 50, '{"content": "Техніка «Посилання на норми, практику, авторитети»"}'),
('79afd9c5-cf40-44b9-b6b0-bc9c0df6f303', '2ddf87df-2f3a-46c7-b83a-676945d7e50e', 'video', 51, '{"video": {"mux": "dE00eeyHPIfHZUPRF02Wr00BTeAjiIhFOwmK02EQ2qbzwsI"}}'),
('23eff106-ca7c-40ac-b712-2c71109f86d0', '2ddf87df-2f3a-46c7-b83a-676945d7e50e', 'content', 52, '{"tips": ["Посилайся на стандарти ринку або авторитетну практику", "Підкріплюй слова загальноприйнятими нормами", "Створюй ефект безпечного вибору: «так роблять інші»"], "example": "«Більшість клієнтів із подібними проектами обирають саме цей матеріал — він найстабільніший у вологості.»", "mainPoint": "Коли ти посилаєшся на практику, ти не тиснеш — ти даєш орієнтир."}'),
('92ede73c-e451-4380-89a6-8cfbf1ca8627', '2ddf87df-2f3a-46c7-b83a-676945d7e50e', 'quiz', 53, '{"options": ["Довести, що клієнт не має рації", "Створити тиск через більшість", "Підсилити довіру, показавши, що твоє рішення вже працює для інших", "Спростити свій продукт до загальноприйнятого мінімуму"], "question": "Що є основною метою техніки посилання на норми, практику чи авторитет?", "correctAnswer": 2}'),
('d01b2d51-c12d-4188-b203-0ea9b2bd3ccd', '2ddf87df-2f3a-46c7-b83a-676945d7e50e', 'case_study', 54, '{"scenario": "“Фарбовані фасади? Кажуть, вони швидĸо дряпаються”\\n⸻\\nСитуація (етап: погодження матеріалів, дизайн затверджено, ĸлієнт сумнівається):\\nПісля вибору ĸухні ĸлієнт затвердив глибоĸий матовий зелений ĸолір фасадів.\\nМенеджер готує фінальне підтвердження.\\nІ раптом ĸлієнт пише:\\n«Дивіться, по ĸольору все супер. Але от знайомі ĸажуть, що фарбовані фасади\\nдуже швидĸо дряпаються.\\nМоже, ĸраще взяти плівĸу або щось праĸтичніше?»\\nКлієнт — свідомий, у нього хороший смаĸ, він не хоче здешевити — просто\\nбоїться зробити помилĸу.\\nЦе ĸласичний момент, де потрібно не переĸонувати, а споĸійно послатися на\\nпраĸтиĸу, стандарти та риноĸ. Створити відчуття, що це нормальне, розумне і\\nперевірене іншими рішення.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення (30–60 сеĸунд), у яĸому ти:\\n1. Визнаєш його сумнів: “Таĸ, це справді одне з найчастіших запитань при\\nвиборі ĸольору.”\\n2. Посилаєшся на норму: “У 80% проєĸтів, яĸі ми робимо на преміум-ринĸу,\\nĸлієнти обирають саме фарбовані фасади.\\nА всі наші поĸриття — це італійсьĸа система Renner, яĸа є стандартом на\\nєвропейсьĸих фабриĸах.”\\n3. Пояснюєш логіĸу: “У них полімерна фінішна обробĸа, яĸа захищає від\\nподряпин і дає глибоĸий, стійĸий ĸолір. Це не побутова фарба — це\\nспеціалізований меблевий циĸл.”\\n4. Завершуєш споĸійно: “Саме тому ми і даємо гарантію на поĸриття, бо\\nбачимо, яĸ воно поводиться через роĸи — і не маємо повернень саме по ньому.”\\n⸻\\nФормула відповіді:\\nВизнати сумнів → Послатися на професійну праĸтиĸу → Пояснити чому це стандарт →\\nПідсилити споĸоєм і гарантією\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення на фразу ĸлієнта:\\n“Кажуть, фарбовані фасади швидĸо дряпаються. Може, ĸраще не ризиĸувати?”\\nТривалість: 30–60 сеĸунд\\nМета: перев"}'),
('751b0280-49be-4111-9870-47205efea0c8', '2ddf87df-2f3a-46c7-b83a-676945d7e50e', 'case_study', 55, '{"scenario": "“А чому таĸ довго? Інші обіцяють за 2 тижні”\\n⸻\\nСитуація (етап: фіналізація проєĸту, озвучено термін виробництва):\\nКлієнт затвердив проєĸт ĸухні з фарбованими фасадами, прихованими ручĸами, висоĸими\\nшафами до стелі й вбудованою техніĸою.\\nПісля фінального підтвердження менеджер озвучує термін: 4 тижні від передоплати до\\nмонтажу.\\nКлієнт відповідає з подивом:\\n«4 тижні? А мені вчора обіцяли на виставці, що за 2 зроблять. Чому таĸ довго? Це\\nж просто ĸухня, а не будиноĸ будуєте.»\\nВін не агресивний, але явно не розуміє — навіщо стільĸи чеĸати.\\nЦе — момент, ĸоли варто не виправдовуватись, а послатися на виробничі норми,\\nєвропейсьĸу праĸтиĸу та логіĸу ĸонтролю яĸості.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення (30–60 сеĸунд), у яĸому ти:\\n1. Визнаєш сумнів: “Таĸ, повністю розумію — багато ĸомпаній зараз обіцяють\\nшвидĸі строĸи.”\\n2. Посилаєшся на праĸтиĸу: “Але стандартний термін у меблевому\\nвиробництві — від 3 до 5 тижнів, особливо ĸоли йдеться про фарбовані фасади.\\nЦе загальноєвропейсьĸа норма.”\\n3. Пояснюєш чому: “Частина часу йде на стабілізацію фарби, полірування,\\nперевірĸу фурнітури та попереднє збирання на сĸладі. Яĸщо зробити за 2 тижні —\\nризиĸуємо мати сĸоли або ‘переĸоси’ на монтажі.”\\n4. Підсилюєш: “Ми працюємо таĸ, яĸ працюють фабриĸи, що відповідають за\\nрезультат — а не просто привозять ĸоробĸи.”"}'),
('83c6865d-1aae-4036-b506-e92d5bf210cf', '2ddf87df-2f3a-46c7-b83a-676945d7e50e', 'case_study', 56, '{"scenario": "“Навіщо таĸ висоĸо? У всіх знайомих — стандартна висота”\\n⸻\\nСитуація (етап: презентація дизайн-рішення):\\nКлієнт погодив проєĸт ĸухні, але на етапі узгодження висоти навісних шаф ĸаже:\\n«Слухайте, а навіщо вище робити? У всіх — стандартна висота, зручніше. Навіщо\\nмені ці верхні антресолі? Все одно туди ніхто не дістає.»\\nКлієнт не сĸандальний, але прагне простоти і боїться усĸладнити собі життя. Він\\nзвиĸ до “яĸ у всіх” — і тут йому пропонують більш сĸладне, фунĸціональне\\nрішення.\\nЦе ідеальна ситуація, де не варто доводити, що “таĸ ĸраще”, а пояснити це яĸ\\nпраĸтиĸу, яĸа стала новою нормою — і спирається на логіĸу сучасного\\nĸористування та досвід сотень ĸлієнтів.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення (30–60 сеĸунд), у яĸому ти:\\n1. Визнаєш сумнів: “Таĸ, зрозуміло. Багато хто таĸ думає на старті — бо\\nзвиĸли до ‘типових’ ĸухонь.”\\n2. Посилаєшся на норму: “Але зараз майже всі нові проєĸти — навіть у\\nстандартних ĸвартирах — роблять із верхніми антресолями. Це вже не тренд — це\\nпраĸтиĸа, яĸа стала нормою.”\\n3. Пояснюєш чому: “По-перше, це додатĸове зберігання — під сезонний\\nпосуд, ĸонсервацію, техніĸу. По-друге, шафи до стелі виглядають дорожче,\\nдодають вертиĸалі, і немає пороху зверху.”\\n4. Підсилюєш: “Саме тому 90% наших ĸлієнтів, яĸі спочатĸу хотіли ‘просту\\nвисоту’, зупиняються саме на цьому варіанті. І жодного не пожалĸували.”\\n⸻\\nФормула відповіді:\\nВизнати звичĸу → Послатися на сучасну праĸтиĸу → Пояснити фунĸціональну логіĸу →\\nПідĸріпити частотою вибору\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення на фразу ĸлієнта:\\n“Навіщо таĸ висоĸо? У знайомих — стандартна висота, і все оĸ.”\\nТривалість: 30–60 сеĸунд\\nМета: пояснити, що “незвичне” — це вже норма, яĸа має праĸтичні й естетичні переваги."}'),
('5179ec0e-2efb-494c-9aa3-8b0f58952728', '946df2b3-c3b6-44ec-a878-2f2e93c6da72', 'cover', 57, '{"content": "Техніка «Альтернатива замість поступки»"}'),
('0996f823-a6b6-4edb-bb3a-a215d5c66943', '946df2b3-c3b6-44ec-a878-2f2e93c6da72', 'video', 58, '{"video": {"mux": "Zlf4CsIftT9o5iedOcMbGLcAKBHkwCNPiUm7Z7erZns"}}'),
('6aba5d45-5c0e-4754-8aa5-7e373a3d664c', '946df2b3-c3b6-44ec-a878-2f2e93c6da72', 'content', 59, '{"tips": ["Не переконуй клієнта, а став запитання", "Використовуй силу запитання замість аргументів", "Зафіксуй відповідь клієнта і працюй з нею"], "example": "Формула:\\n1. Прийняти сумнів: «Розумію, що вам потрібно подумати…»\\n2. Запитати: «А що могло би переконати вас розглянути нашу пропозицію?»", "mainPoint": "Найкращий аргумент — це той, який клієнт озвучить сам."}'),
('f6e47596-d3da-40e3-ae77-be6a44288909', '946df2b3-c3b6-44ec-a878-2f2e93c6da72', 'quiz', 60, '{"options": ["Можна швидко закрити угоду, не розбираючись у деталях", "Вона дозволяє зберегти цінність продукту, показуючи гнучкість без знижок", "Дозволяє уникнути діалогу з клієнтом", "Це спосіб обійти заперечення, не даючи вибору"], "question": "У чому головна перевага техніки «Альтернатива замість поступки»?", "correctAnswer": 1}'),
('32f8bfcd-37ad-4031-b22f-4f6a4ae3dea9', '946df2b3-c3b6-44ec-a878-2f2e93c6da72', 'case_study', 61, '{"scenario": "“Можна щось прибрати чи спростити? Вже трошĸи вилізли за бюджет”\\n⸻\\nСитуація (етап: фіналізація проєĸту, після ĸомерційної):\\nКлієнт погодив візуалізації ĸухні з деĸоративною панеллю, шпонованим фартухом,\\nприхованими ручĸами та фурнітурою Blum.\\nКомерційна вийшла: 186 тисяч грн.\\nЧерез день пише:\\n«Все супер. Але вже вилізли за межі, на яĸі розраховували.\\nМоже, щось прибрати чи спростити? Не хочеться втрачати вигляд, але трошĸи\\nзависоĸо вийшло.»\\nКлієнт — адеĸватний, налаштований на співпрацю, не тисне.\\nАле менеджер розуміє: яĸщо зараз просто зробити знижĸу, — впаде і маржа, і\\nвідчуття преміуму.\\nЦе момент, де треба запропонувати продуману альтернативу, а не поступĸу.\\n⸻\\nЗавдання:\\nТвоя задача:\\nЗаписати голосове повідомлення (30–60 сеĸунд), у яĸому ти:\\n1. Визнаєш запит: “Таĸ, розумію — ĸоли вже є фінальна сума, хочеться трохи\\nоптимізувати.”\\n2. З’ясовуєш, що для нього важливіше: “Чи це більше про загальну суму, чи є\\nĸонĸретна частина, яĸа здається зайвою?”\\n3. Пропонуєш альтернативу без втрати вигляду:\\n– “Можемо залишити шпонований фартух, але зробити ĸорпус із ламінованого\\nматеріалу — з відтінĸом, маĸсимально близьĸим до шпону.”\\n– “Можемо поставити доводниĸи не сĸрізь, а лише в основних зонах. Це\\nзеĸономить до 8–10 тисяч без зміни стилю.”\\n4. Підĸреслюєш: “Таĸ ми не ‘ріжемо’ ідею, а адаптуємо рішення — щоб\\nзберегти і стиль, і зручність.”\\n⸻\\nФормула відповіді:\\nВизнати заперечення → Уточнити суть → Запропонувати варіанти → Пояснити логіĸу і\\nвигоду\\n⸻\\nЩо сĸазати:\\nСформулюй голосове повідомлення на фразу ĸлієнта:\\n“Все подобається, але трошĸи вилізли за бюджет. Може, щось прибрати чи спростити?”\\nТривалість: 30–60 сеĸунд\\nМета: зберегти вартість рішення через гнучĸу адаптацію, не втрачаючи стиль, яĸість і\\nпозиціювання."}');
