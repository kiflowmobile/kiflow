This document is a comprehensive technical specification designed to be used as a prompt for an LLM (like GPT-4, Claude 3.5 Sonnet, or Gemini 1.5 Pro) to generate the codebase for the application.

---

# Technical Specification: TikTok-Style AI Learning Platform

## 1. Project Overview

A micro-learning mobile application where content is delivered via a vertical "swipe-up" feed (TikTok style).

* **Key Features:** Company-based access via codes, public courses, interactive quizzes, and AI-evaluated Case Studies.
* **Tech Stack:** Expo (React Native), Supabase (Auth, DB, Edge Functions), Zustand (State), NativeWind (UI), Gemini API (AI Evaluation).

---

## 2. Database Schema (PostgreSQL / Supabase)

```sql
-- ENUMS
create type slide_type as enum ('cover', 'text', 'video', 'quiz', 'use_case');

-- TABLES
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  created_at day default now()
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id),
  title text not null,
  description text,
  is_public boolean default false
);

create table invite_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  company_id uuid references companies(id) on delete cascade
);

create table invite_code_courses (
  invite_code_id uuid references invite_codes(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  primary key (invite_code_id, course_id)
);

create table user_enrollments (
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  from_invite_code_id uuid references invite_codes(id),
  primary key (user_id, course_id)
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  order_index int not null
);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references modules(id) on delete cascade,
  title text not null,
  order_index int not null
);

create table slides (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete cascade,
  type slide_type not null,
  order_index int not null,
  content jsonb not null default '{}'::jsonb -- Stores: text, video_url, quiz_data {question, options, correct_idx}
);

create table assessment_criteria (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  title text not null -- e.g., "Clarity", "Critical Thinking"
);

create table user_case_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  slide_id uuid references slides(id) on delete cascade,
  user_answer text not null,
  ai_feedback text
);

create table response_scores (
  id uuid primary key default gen_random_uuid(),
  response_id uuid references user_case_responses(id) on delete cascade,
  criterion_id uuid references assessment_criteria(id) on delete cascade,
  score int not null -- 1 to 100
);

create table slide_scores (
  user_id uuid references auth.users(id) on delete cascade,
  slide_id uuid references slides(id) on delete cascade,
  module_id uuid references modules(id),
  course_id uuid references courses(id),
  score numeric(5,2) not null, -- Normalized 0-100
  primary key (user_id, slide_id)
);

```

---

## 3. App Architecture & Navigation (Expo Router)

### File Structure:

* `app/(auth)/`: login, register, welcome, forgot-password.
* `app/enter-code/`: Input screen for invite codes.
* `app/(tabs)/courses/`: Course list and `[id].tsx` details.
* `app/(tabs)/progress/`: Statistics and `[courseId].tsx` module breakdown.
* `app/(tabs)/profile/`: Profile edit and password change.
* `app/viewer/[lessonId]`: The TikTok-style vertical slider.

### State Management (Zustand):

* `useAuthStore`: Handles Supabase session and user profile.
* `useCourseStore`: Tracks current lesson progress, slide index, and temporary quiz/case answers.

---

## 4. Feature Specifications

### Vertical Content Viewer:

* Implemented using `FlashList` or `FlatList` with `pagingEnabled` and `snapToInterval`.
* **Cover Slide:** Displays Lesson title.
* **Video Slide:** Auto-plays when in view using `expo-av`.
* **Quiz Slide:** Radio buttons for options. Record `100` in `slide_scores` if correct on first try, else `0`.
* **Case Study:** Large text input. On submit, trigger `evaluation-flow`.

### AI Evaluation Flow (Supabase Edge Function):

1. **Trigger:** App calls `evaluate-case` function with `user_answer` and `slide_id`.
2. **Context:** Function fetches `assessment_criteria` for the course.
3. **Prompt:** > "Analyze the user's answer: [user_answer]. Evaluate it based on these criteria: [criteria_list]. Return a JSON object with a 'feedback' string and a 'scores' object mapping criteria titles to 0-100 values."
4. **Save:** Function inserts into `user_case_responses` and `response_scores`.
5. **Calculate:** Function averages the scores and updates `slide_scores`.

---

## 5. Implementation Instructions for LLM

### Step 1: Authentication & Layout

* Set up `_layout.tsx` with Supabase Auth listener.
* Implement protected routes (redirect to `/welcome` if not logged in).

### Step 2: Access Logic

* Implement the `redeem_invite_code` RPC function to link users to courses via the `invite_codes` table.

### Step 3: Vertical Slide UI

* Create a `SlideRenderer` component that switches between Cover, Text, Video, Quiz, and Case Study based on the `type` field.
* Ensure full-screen height for each slide with smooth vertical snapping.

### Step 4: Scoring & Progress

* Create a logic handler:
* `onQuizSubmit`: Compare `selected_idx` with `content.correct_idx`.
* `onCaseSubmit`: Show loading spinner, await Edge Function response, then navigate to a "Result Slide".


* Implement progress calculation by averaging values in `slide_scores`.

---

## 6. Security (Row Level Security)

* `courses`: `select` allowed if `is_public = true` OR `exists` in `user_enrollments`.
* `user_case_responses`: `all` allowed only where `auth.uid() = user_id`.
* `slide_scores`: `select` allowed only for the owner.

---

**End of Specification.**