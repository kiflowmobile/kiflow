drop extension if exists "pg_net";

create extension if not exists "citext" with schema "public";


  create table "public"."chat_history" (
    "user_id" uuid not null,
    "course_id" uuid,
    "slide_id" uuid not null,
    "messages" jsonb,
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."companies" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "service_standards" jsonb,
    "code" citext not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."companies" enable row level security;


  create table "public"."company_courses" (
    "company_id" uuid not null,
    "course_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."company_courses" enable row level security;


  create table "public"."company_members" (
    "user_id" uuid not null,
    "company_id" uuid not null,
    "joined_via_code" citext,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."company_members" enable row level security;


  create table "public"."courses" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "image" text,
    "is_public" boolean not null default false,
    "code" citext,
    "contact_email" citext,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."courses" enable row level security;


  create table "public"."criterias" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "course_id" uuid default gen_random_uuid(),
    "key" text,
    "name" text,
    "description" text
      );


alter table "public"."criterias" enable row level security;


  create table "public"."main_rating" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "rating" real,
    "user_id" uuid default gen_random_uuid(),
    "module_id" uuid default gen_random_uuid(),
    "criteria_key" text,
    "course_id" uuid
      );


alter table "public"."main_rating" enable row level security;


  create table "public"."modules" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "course_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "module_order" numeric
      );


alter table "public"."modules" enable row level security;


  create table "public"."quiz_answers" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid not null default gen_random_uuid(),
    "course_id" uuid default gen_random_uuid(),
    "module_id" uuid default gen_random_uuid(),
    "slide_id" uuid not null default gen_random_uuid(),
    "selected_answer" smallint,
    "correct_answer" smallint
      );


alter table "public"."quiz_answers" enable row level security;


  create table "public"."slide_ai_prompts" (
    "id" uuid not null default gen_random_uuid(),
    "slide_id" uuid not null,
    "prompt" text not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "question" text
      );



  create table "public"."slides" (
    "id" uuid not null default gen_random_uuid(),
    "module_id" uuid not null,
    "slide_data" jsonb not null,
    "slide_order" integer not null,
    "slide_type" text not null,
    "slide_title" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."slides" enable row level security;


  create table "public"."user_course_summaries" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "user_id" uuid,
    "course_id" uuid,
    "progress" smallint,
    "last_slide_id" uuid,
    "modules" jsonb
      );


alter table "public"."user_course_summaries" enable row level security;


  create table "public"."users" (
    "id" uuid not null,
    "full_name" text,
    "email" text,
    "avatar_url" text,
    "created_at" timestamp with time zone default now(),
    "first_name" text,
    "last_name" text,
    "current_code" text
      );


alter table "public"."users" enable row level security;

CREATE UNIQUE INDEX chat_history_pkey ON public.chat_history USING btree (user_id, slide_id);

CREATE UNIQUE INDEX companies_code_key ON public.companies USING btree (code);

CREATE UNIQUE INDEX companies_code_unique ON public.companies USING btree (code);

CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id);

CREATE UNIQUE INDEX company_courses_pkey ON public.company_courses USING btree (company_id, course_id);

CREATE UNIQUE INDEX company_members_pkey ON public.company_members USING btree (user_id, company_id);

CREATE UNIQUE INDEX courses_code_key ON public.courses USING btree (code);

CREATE UNIQUE INDEX courses_pkey ON public.courses USING btree (id);

CREATE UNIQUE INDEX criterias_pkey ON public.criterias USING btree (id);

CREATE INDEX idx_company_courses_comp ON public.company_courses USING btree (company_id);

CREATE INDEX idx_company_courses_course ON public.company_courses USING btree (course_id);

CREATE INDEX idx_modules_course_id ON public.modules USING btree (course_id);

CREATE INDEX idx_slides_module_id ON public.slides USING btree (module_id);

CREATE INDEX idx_slides_module_order ON public.slides USING btree (module_id, slide_order);

CREATE UNIQUE INDEX main_rating_pkey ON public.main_rating USING btree (id);

CREATE UNIQUE INDEX main_rating_unique ON public.main_rating USING btree (user_id, module_id, criteria_key);

CREATE UNIQUE INDEX main_rating_unique_user_module_criteria_course ON public.main_rating USING btree (user_id, module_id, criteria_key, course_id);

CREATE UNIQUE INDEX modules_pkey ON public.modules USING btree (id);

CREATE UNIQUE INDEX quiz_answers_pkey ON public.quiz_answers USING btree (user_id, slide_id);

CREATE UNIQUE INDEX slide_ai_prompts_pkey ON public.slide_ai_prompts USING btree (id);

CREATE UNIQUE INDEX slides_pkey ON public.slides USING btree (id);

CREATE UNIQUE INDEX unique_user_module_criteria ON public.main_rating USING btree (user_id, module_id, criteria_key);

CREATE UNIQUE INDEX user_course_summaries_pkey ON public.user_course_summaries USING btree (id);

CREATE UNIQUE INDEX user_course_unique ON public.user_course_summaries USING btree (user_id, course_id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."chat_history" add constraint "chat_history_pkey" PRIMARY KEY using index "chat_history_pkey";

alter table "public"."companies" add constraint "companies_pkey" PRIMARY KEY using index "companies_pkey";

alter table "public"."company_courses" add constraint "company_courses_pkey" PRIMARY KEY using index "company_courses_pkey";

alter table "public"."company_members" add constraint "company_members_pkey" PRIMARY KEY using index "company_members_pkey";

alter table "public"."courses" add constraint "courses_pkey" PRIMARY KEY using index "courses_pkey";

alter table "public"."criterias" add constraint "criterias_pkey" PRIMARY KEY using index "criterias_pkey";

alter table "public"."main_rating" add constraint "main_rating_pkey" PRIMARY KEY using index "main_rating_pkey";

alter table "public"."modules" add constraint "modules_pkey" PRIMARY KEY using index "modules_pkey";

alter table "public"."quiz_answers" add constraint "quiz_answers_pkey" PRIMARY KEY using index "quiz_answers_pkey";

alter table "public"."slide_ai_prompts" add constraint "slide_ai_prompts_pkey" PRIMARY KEY using index "slide_ai_prompts_pkey";

alter table "public"."slides" add constraint "slides_pkey" PRIMARY KEY using index "slides_pkey";

alter table "public"."user_course_summaries" add constraint "user_course_summaries_pkey" PRIMARY KEY using index "user_course_summaries_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."chat_history" add constraint "chat_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) not valid;

alter table "public"."chat_history" validate constraint "chat_history_user_id_fkey";

alter table "public"."companies" add constraint "companies_code_key" UNIQUE using index "companies_code_key";

alter table "public"."company_courses" add constraint "fk_company_courses_company" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."company_courses" validate constraint "fk_company_courses_company";

alter table "public"."company_courses" add constraint "fk_company_courses_course" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."company_courses" validate constraint "fk_company_courses_course";

alter table "public"."company_members" add constraint "company_members_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE not valid;

alter table "public"."company_members" validate constraint "company_members_company_id_fkey";

alter table "public"."company_members" add constraint "company_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."company_members" validate constraint "company_members_user_id_fkey";

alter table "public"."courses" add constraint "courses_code_key" UNIQUE using index "courses_code_key";

alter table "public"."main_rating" add constraint "main_rating_unique" UNIQUE using index "main_rating_unique";

alter table "public"."main_rating" add constraint "unique_user_module_criteria" UNIQUE using index "unique_user_module_criteria";

alter table "public"."modules" add constraint "fk_modules_course" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."modules" validate constraint "fk_modules_course";

alter table "public"."slide_ai_prompts" add constraint "slide_ai_prompts_slide_id_fkey" FOREIGN KEY (slide_id) REFERENCES slides(id) ON DELETE CASCADE not valid;

alter table "public"."slide_ai_prompts" validate constraint "slide_ai_prompts_slide_id_fkey";

alter table "public"."slides" add constraint "fk_slides_module" FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE not valid;

alter table "public"."slides" validate constraint "fk_slides_module";

alter table "public"."user_course_summaries" add constraint "user_course_unique" UNIQUE using index "user_course_unique";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public._normalize_code(p text)
 RETURNS citext
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select nullif(upper(trim(p)), '')
$function$
;

CREATE OR REPLACE FUNCTION public.claim_company_access(p_code citext)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_company_id uuid;
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  select id into v_company_id
  from public.companies
  where code = p_code;

  if v_company_id is null then
    raise exception 'INVALID_CODE';
  end if;

  insert into public.company_members(user_id, company_id, joined_via_code)
  values (v_uid, v_company_id, p_code)
  on conflict (user_id, company_id) do nothing;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into public.users (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_company_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
  v_code citext;
  v_company_id uuid;
begin
  -- читаем код из метаданных пользователя (поддержим несколько вариантов ключа)
  v_code := public._normalize_code(
              coalesce(
                new.raw_user_meta_data->>'company_code',
                new.raw_user_meta_data->>'code',
                new.raw_user_meta_data->>'companyCode'
              )
            );

  if v_code is null then
    return new; -- кода нет — ничего не делаем
  end if;

  -- находим компанию по коду
  select id into v_company_id
  from public.companies
  where code = v_code;

  -- если компания найдена — добавляем membership
  if v_company_id is not null then
    insert into public.company_members (user_id, company_id, joined_via_code)
    values (new.id, v_company_id, v_code)
    on conflict (user_id, company_id) do nothing;
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.set_course_progress_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

grant delete on table "public"."chat_history" to "anon";

grant insert on table "public"."chat_history" to "anon";

grant references on table "public"."chat_history" to "anon";

grant select on table "public"."chat_history" to "anon";

grant trigger on table "public"."chat_history" to "anon";

grant truncate on table "public"."chat_history" to "anon";

grant update on table "public"."chat_history" to "anon";

grant delete on table "public"."chat_history" to "authenticated";

grant insert on table "public"."chat_history" to "authenticated";

grant references on table "public"."chat_history" to "authenticated";

grant select on table "public"."chat_history" to "authenticated";

grant trigger on table "public"."chat_history" to "authenticated";

grant truncate on table "public"."chat_history" to "authenticated";

grant update on table "public"."chat_history" to "authenticated";

grant delete on table "public"."chat_history" to "service_role";

grant insert on table "public"."chat_history" to "service_role";

grant references on table "public"."chat_history" to "service_role";

grant select on table "public"."chat_history" to "service_role";

grant trigger on table "public"."chat_history" to "service_role";

grant truncate on table "public"."chat_history" to "service_role";

grant update on table "public"."chat_history" to "service_role";

grant delete on table "public"."companies" to "anon";

grant insert on table "public"."companies" to "anon";

grant references on table "public"."companies" to "anon";

grant select on table "public"."companies" to "anon";

grant trigger on table "public"."companies" to "anon";

grant truncate on table "public"."companies" to "anon";

grant update on table "public"."companies" to "anon";

grant delete on table "public"."companies" to "authenticated";

grant insert on table "public"."companies" to "authenticated";

grant references on table "public"."companies" to "authenticated";

grant select on table "public"."companies" to "authenticated";

grant trigger on table "public"."companies" to "authenticated";

grant truncate on table "public"."companies" to "authenticated";

grant update on table "public"."companies" to "authenticated";

grant delete on table "public"."companies" to "service_role";

grant insert on table "public"."companies" to "service_role";

grant references on table "public"."companies" to "service_role";

grant select on table "public"."companies" to "service_role";

grant trigger on table "public"."companies" to "service_role";

grant truncate on table "public"."companies" to "service_role";

grant update on table "public"."companies" to "service_role";

grant delete on table "public"."company_courses" to "anon";

grant insert on table "public"."company_courses" to "anon";

grant references on table "public"."company_courses" to "anon";

grant select on table "public"."company_courses" to "anon";

grant trigger on table "public"."company_courses" to "anon";

grant truncate on table "public"."company_courses" to "anon";

grant update on table "public"."company_courses" to "anon";

grant delete on table "public"."company_courses" to "authenticated";

grant insert on table "public"."company_courses" to "authenticated";

grant references on table "public"."company_courses" to "authenticated";

grant select on table "public"."company_courses" to "authenticated";

grant trigger on table "public"."company_courses" to "authenticated";

grant truncate on table "public"."company_courses" to "authenticated";

grant update on table "public"."company_courses" to "authenticated";

grant delete on table "public"."company_courses" to "service_role";

grant insert on table "public"."company_courses" to "service_role";

grant references on table "public"."company_courses" to "service_role";

grant select on table "public"."company_courses" to "service_role";

grant trigger on table "public"."company_courses" to "service_role";

grant truncate on table "public"."company_courses" to "service_role";

grant update on table "public"."company_courses" to "service_role";

grant delete on table "public"."company_members" to "anon";

grant insert on table "public"."company_members" to "anon";

grant references on table "public"."company_members" to "anon";

grant select on table "public"."company_members" to "anon";

grant trigger on table "public"."company_members" to "anon";

grant truncate on table "public"."company_members" to "anon";

grant update on table "public"."company_members" to "anon";

grant delete on table "public"."company_members" to "authenticated";

grant insert on table "public"."company_members" to "authenticated";

grant references on table "public"."company_members" to "authenticated";

grant select on table "public"."company_members" to "authenticated";

grant trigger on table "public"."company_members" to "authenticated";

grant truncate on table "public"."company_members" to "authenticated";

grant update on table "public"."company_members" to "authenticated";

grant delete on table "public"."company_members" to "service_role";

grant insert on table "public"."company_members" to "service_role";

grant references on table "public"."company_members" to "service_role";

grant select on table "public"."company_members" to "service_role";

grant trigger on table "public"."company_members" to "service_role";

grant truncate on table "public"."company_members" to "service_role";

grant update on table "public"."company_members" to "service_role";

grant delete on table "public"."courses" to "anon";

grant insert on table "public"."courses" to "anon";

grant references on table "public"."courses" to "anon";

grant select on table "public"."courses" to "anon";

grant trigger on table "public"."courses" to "anon";

grant truncate on table "public"."courses" to "anon";

grant update on table "public"."courses" to "anon";

grant delete on table "public"."courses" to "authenticated";

grant insert on table "public"."courses" to "authenticated";

grant references on table "public"."courses" to "authenticated";

grant select on table "public"."courses" to "authenticated";

grant trigger on table "public"."courses" to "authenticated";

grant truncate on table "public"."courses" to "authenticated";

grant update on table "public"."courses" to "authenticated";

grant delete on table "public"."courses" to "service_role";

grant insert on table "public"."courses" to "service_role";

grant references on table "public"."courses" to "service_role";

grant select on table "public"."courses" to "service_role";

grant trigger on table "public"."courses" to "service_role";

grant truncate on table "public"."courses" to "service_role";

grant update on table "public"."courses" to "service_role";

grant delete on table "public"."criterias" to "anon";

grant insert on table "public"."criterias" to "anon";

grant references on table "public"."criterias" to "anon";

grant select on table "public"."criterias" to "anon";

grant trigger on table "public"."criterias" to "anon";

grant truncate on table "public"."criterias" to "anon";

grant update on table "public"."criterias" to "anon";

grant delete on table "public"."criterias" to "authenticated";

grant insert on table "public"."criterias" to "authenticated";

grant references on table "public"."criterias" to "authenticated";

grant select on table "public"."criterias" to "authenticated";

grant trigger on table "public"."criterias" to "authenticated";

grant truncate on table "public"."criterias" to "authenticated";

grant update on table "public"."criterias" to "authenticated";

grant delete on table "public"."criterias" to "service_role";

grant insert on table "public"."criterias" to "service_role";

grant references on table "public"."criterias" to "service_role";

grant select on table "public"."criterias" to "service_role";

grant trigger on table "public"."criterias" to "service_role";

grant truncate on table "public"."criterias" to "service_role";

grant update on table "public"."criterias" to "service_role";

grant delete on table "public"."main_rating" to "anon";

grant insert on table "public"."main_rating" to "anon";

grant references on table "public"."main_rating" to "anon";

grant select on table "public"."main_rating" to "anon";

grant trigger on table "public"."main_rating" to "anon";

grant truncate on table "public"."main_rating" to "anon";

grant update on table "public"."main_rating" to "anon";

grant delete on table "public"."main_rating" to "authenticated";

grant insert on table "public"."main_rating" to "authenticated";

grant references on table "public"."main_rating" to "authenticated";

grant select on table "public"."main_rating" to "authenticated";

grant trigger on table "public"."main_rating" to "authenticated";

grant truncate on table "public"."main_rating" to "authenticated";

grant update on table "public"."main_rating" to "authenticated";

grant delete on table "public"."main_rating" to "service_role";

grant insert on table "public"."main_rating" to "service_role";

grant references on table "public"."main_rating" to "service_role";

grant select on table "public"."main_rating" to "service_role";

grant trigger on table "public"."main_rating" to "service_role";

grant truncate on table "public"."main_rating" to "service_role";

grant update on table "public"."main_rating" to "service_role";

grant delete on table "public"."modules" to "anon";

grant insert on table "public"."modules" to "anon";

grant references on table "public"."modules" to "anon";

grant select on table "public"."modules" to "anon";

grant trigger on table "public"."modules" to "anon";

grant truncate on table "public"."modules" to "anon";

grant update on table "public"."modules" to "anon";

grant delete on table "public"."modules" to "authenticated";

grant insert on table "public"."modules" to "authenticated";

grant references on table "public"."modules" to "authenticated";

grant select on table "public"."modules" to "authenticated";

grant trigger on table "public"."modules" to "authenticated";

grant truncate on table "public"."modules" to "authenticated";

grant update on table "public"."modules" to "authenticated";

grant delete on table "public"."modules" to "service_role";

grant insert on table "public"."modules" to "service_role";

grant references on table "public"."modules" to "service_role";

grant select on table "public"."modules" to "service_role";

grant trigger on table "public"."modules" to "service_role";

grant truncate on table "public"."modules" to "service_role";

grant update on table "public"."modules" to "service_role";

grant delete on table "public"."quiz_answers" to "anon";

grant insert on table "public"."quiz_answers" to "anon";

grant references on table "public"."quiz_answers" to "anon";

grant select on table "public"."quiz_answers" to "anon";

grant trigger on table "public"."quiz_answers" to "anon";

grant truncate on table "public"."quiz_answers" to "anon";

grant update on table "public"."quiz_answers" to "anon";

grant delete on table "public"."quiz_answers" to "authenticated";

grant insert on table "public"."quiz_answers" to "authenticated";

grant references on table "public"."quiz_answers" to "authenticated";

grant select on table "public"."quiz_answers" to "authenticated";

grant trigger on table "public"."quiz_answers" to "authenticated";

grant truncate on table "public"."quiz_answers" to "authenticated";

grant update on table "public"."quiz_answers" to "authenticated";

grant delete on table "public"."quiz_answers" to "service_role";

grant insert on table "public"."quiz_answers" to "service_role";

grant references on table "public"."quiz_answers" to "service_role";

grant select on table "public"."quiz_answers" to "service_role";

grant trigger on table "public"."quiz_answers" to "service_role";

grant truncate on table "public"."quiz_answers" to "service_role";

grant update on table "public"."quiz_answers" to "service_role";

grant delete on table "public"."slide_ai_prompts" to "anon";

grant insert on table "public"."slide_ai_prompts" to "anon";

grant references on table "public"."slide_ai_prompts" to "anon";

grant select on table "public"."slide_ai_prompts" to "anon";

grant trigger on table "public"."slide_ai_prompts" to "anon";

grant truncate on table "public"."slide_ai_prompts" to "anon";

grant update on table "public"."slide_ai_prompts" to "anon";

grant delete on table "public"."slide_ai_prompts" to "authenticated";

grant insert on table "public"."slide_ai_prompts" to "authenticated";

grant references on table "public"."slide_ai_prompts" to "authenticated";

grant select on table "public"."slide_ai_prompts" to "authenticated";

grant trigger on table "public"."slide_ai_prompts" to "authenticated";

grant truncate on table "public"."slide_ai_prompts" to "authenticated";

grant update on table "public"."slide_ai_prompts" to "authenticated";

grant delete on table "public"."slide_ai_prompts" to "service_role";

grant insert on table "public"."slide_ai_prompts" to "service_role";

grant references on table "public"."slide_ai_prompts" to "service_role";

grant select on table "public"."slide_ai_prompts" to "service_role";

grant trigger on table "public"."slide_ai_prompts" to "service_role";

grant truncate on table "public"."slide_ai_prompts" to "service_role";

grant update on table "public"."slide_ai_prompts" to "service_role";

grant delete on table "public"."slides" to "anon";

grant insert on table "public"."slides" to "anon";

grant references on table "public"."slides" to "anon";

grant select on table "public"."slides" to "anon";

grant trigger on table "public"."slides" to "anon";

grant truncate on table "public"."slides" to "anon";

grant update on table "public"."slides" to "anon";

grant delete on table "public"."slides" to "authenticated";

grant insert on table "public"."slides" to "authenticated";

grant references on table "public"."slides" to "authenticated";

grant select on table "public"."slides" to "authenticated";

grant trigger on table "public"."slides" to "authenticated";

grant truncate on table "public"."slides" to "authenticated";

grant update on table "public"."slides" to "authenticated";

grant delete on table "public"."slides" to "service_role";

grant insert on table "public"."slides" to "service_role";

grant references on table "public"."slides" to "service_role";

grant select on table "public"."slides" to "service_role";

grant trigger on table "public"."slides" to "service_role";

grant truncate on table "public"."slides" to "service_role";

grant update on table "public"."slides" to "service_role";

grant delete on table "public"."user_course_summaries" to "anon";

grant insert on table "public"."user_course_summaries" to "anon";

grant references on table "public"."user_course_summaries" to "anon";

grant select on table "public"."user_course_summaries" to "anon";

grant trigger on table "public"."user_course_summaries" to "anon";

grant truncate on table "public"."user_course_summaries" to "anon";

grant update on table "public"."user_course_summaries" to "anon";

grant delete on table "public"."user_course_summaries" to "authenticated";

grant insert on table "public"."user_course_summaries" to "authenticated";

grant references on table "public"."user_course_summaries" to "authenticated";

grant select on table "public"."user_course_summaries" to "authenticated";

grant trigger on table "public"."user_course_summaries" to "authenticated";

grant truncate on table "public"."user_course_summaries" to "authenticated";

grant update on table "public"."user_course_summaries" to "authenticated";

grant delete on table "public"."user_course_summaries" to "service_role";

grant insert on table "public"."user_course_summaries" to "service_role";

grant references on table "public"."user_course_summaries" to "service_role";

grant select on table "public"."user_course_summaries" to "service_role";

grant trigger on table "public"."user_course_summaries" to "service_role";

grant truncate on table "public"."user_course_summaries" to "service_role";

grant update on table "public"."user_course_summaries" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";


  create policy "Enable read access for all users"
  on "public"."companies"
  as permissive
  for select
  to public
using (true);



  create policy "allow everyone to update companies"
  on "public"."companies"
  as permissive
  for update
  to anon, authenticated
using (true)
with check (true);



  create policy "companies_read_by_membership"
  on "public"."companies"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM company_members cm
  WHERE ((cm.company_id = companies.id) AND (cm.user_id = auth.uid())))));



  create policy "Enable read access for all users"
  on "public"."company_courses"
  as permissive
  for select
  to public
using (true);



  create policy "company_courses_read_all_guarded"
  on "public"."company_courses"
  as permissive
  for select
  to authenticated
using (true);



  create policy "cm_insert_self"
  on "public"."company_members"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "cm_select_self"
  on "public"."company_members"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "courses_read_public"
  on "public"."courses"
  as permissive
  for select
  to authenticated
using ((is_public = true));



  create policy "courses_read_via_membership"
  on "public"."courses"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM (company_members cm
     JOIN company_courses cc ON ((cc.company_id = cm.company_id)))
  WHERE ((cc.course_id = courses.id) AND (cm.user_id = auth.uid())))));



  create policy "Enable read access for all users"
  on "public"."criterias"
  as permissive
  for select
  to public
using (true);



  create policy "main_rating_insert_self"
  on "public"."main_rating"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "main_rating_select_self"
  on "public"."main_rating"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "main_rating_update_self"
  on "public"."main_rating"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Enable insert for authenticated users only"
  on "public"."modules"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Enable read access for all users"
  on "public"."modules"
  as permissive
  for select
  to public
using (true);



  create policy "modules_read_via_course_access"
  on "public"."modules"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM courses c
  WHERE ((c.id = modules.course_id) AND (EXISTS ( SELECT 1
           FROM (company_members cm
             JOIN company_courses cc ON ((cc.company_id = cm.company_id)))
          WHERE ((cc.course_id = c.id) AND (cm.user_id = auth.uid()))))))));



  create policy "Allow users to insert their own quiz answers"
  on "public"."quiz_answers"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "Allow users to select their own quiz answers"
  on "public"."quiz_answers"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "Allow users to update their own quiz answers"
  on "public"."quiz_answers"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id));



  create policy "Enable insert for authenticated users only"
  on "public"."quiz_answers"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Enable insert for users based on user_id"
  on "public"."quiz_answers"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Enable read access for all users"
  on "public"."slides"
  as permissive
  for select
  to public
using (true);



  create policy "slides_read_via_module_access"
  on "public"."slides"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM modules m
  WHERE ((m.id = slides.module_id) AND (EXISTS ( SELECT 1
           FROM courses c
          WHERE ((c.id = m.course_id) AND (EXISTS ( SELECT 1
                   FROM (company_members cm
                     JOIN company_courses cc ON ((cc.company_id = cm.company_id)))
                  WHERE ((cc.course_id = c.id) AND (cm.user_id = auth.uid())))))))))));



  create policy "Allow service role insert"
  on "public"."user_course_summaries"
  as permissive
  for insert
  to public
with check (true);



  create policy "Allow update own course"
  on "public"."user_course_summaries"
  as permissive
  for update
  to public
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));



  create policy "Enable insert for authenticated users only"
  on "public"."user_course_summaries"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Enable read access for all users"
  on "public"."user_course_summaries"
  as permissive
  for select
  to public
using (true);



  create policy "Allow insert for authenticated users"
  on "public"."users"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "Users can update their own data"
  on "public"."users"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Users can view their own data"
  on "public"."users"
  as permissive
  for select
  to public
using ((auth.uid() = id));


CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.slide_ai_prompts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


