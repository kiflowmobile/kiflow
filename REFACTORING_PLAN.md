# Kiflow Complete Refactoring Plan

## Executive Summary

Complete rewrite from type-based organization to feature-based architecture with consistent Tailwind styling.

---

## Current State Analysis

### Issues Identified

1. **Type-based organization** - Code split by technical concern (`screens/`, `services/`, `stores/`) instead of business domain
2. **Mixed styling** - NativeWind/Tailwind AND `StyleSheet.create()` used inconsistently
3. **Zero test coverage** - No testing infrastructure
4. **Scattered types** - Types in `/constants/types/` instead of colocated with features
5. **Tight coupling** - Stores directly call services, making testing difficult
6. **No API abstraction** - Direct Supabase calls everywhere
7. **Platform-specific code scattered** - `.web.tsx` and `.native.tsx` variants add complexity
8. **Inconsistent patterns** - Some components use gluestack-ui, others custom implementations

### Current Stack (Keep)

- React Native 0.81 + Expo 54 + Expo Router 6
- Supabase (auth + database)
- Zustand for state management
- TypeScript

### Stack Changes

- **Remove**: `StyleSheet.create()`, custom color constants, manual font loading
- **Add**: Full NativeWind/Tailwind (consistent usage)
- **Keep**: gluestack-ui components (just ensure consistent Tailwind styling)
- **Keep**: Platform-specific files (.web.tsx, .native.tsx pattern)
- **Defer**: Testing infrastructure (add later, focus on architecture now)

---

## Target Architecture

```
src/
├── app/                          # Expo Router (thin layer, minimal logic)
│   ├── (tabs)/
│   ├── auth/
│   ├── courses/
│   ├── module/
│   ├── profile/
│   ├── statistics/
│   └── api/
│
├── features/                     # Feature modules (main code lives here)
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegistrationForm.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── api/
│   │   │   └── authApi.ts
│   │   ├── store/
│   │   │   └── authStore.ts
│   │   ├── utils/
│   │   │   └── authUtils.ts
│   │   ├── types.ts
│   │   └── index.ts              # Public API barrel export
│   │
│   ├── courses/
│   │   ├── components/
│   │   │   ├── CourseCard.tsx
│   │   │   ├── CourseList.tsx
│   │   │   └── CourseDetail.tsx
│   │   ├── hooks/
│   │   │   └── useCourses.ts
│   │   ├── api/
│   │   │   └── coursesApi.ts
│   │   ├── store/
│   │   │   └── coursesStore.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── modules/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── store/
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── lessons/
│   │   ├── components/
│   │   │   └── slides/           # All slide types
│   │   │       ├── TextSlide.tsx
│   │   │       ├── QuizSlide.tsx
│   │   │       ├── VideoSlide.tsx
│   │   │       └── AIChatSlide.tsx
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── store/
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── progress/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── store/
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── profile/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── store/
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── company/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── store/
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── statistics/
│       ├── components/
│       ├── hooks/
│       ├── api/
│       ├── types.ts
│       └── index.ts
│
├── shared/                       # Shared/reusable code
│   ├── ui/                       # Design system components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Spinner.tsx
│   │   ├── Avatar.tsx
│   │   ├── ProgressBar.tsx
│   │   └── index.ts
│   │
│   ├── layouts/                  # Layout components
│   │   ├── SafeAreaView.tsx
│   │   ├── ScrollView.tsx
│   │   └── Header.tsx
│   │
│   ├── lib/                      # External service wrappers
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── types.ts
│   │   ├── amplitude/
│   │   │   └── analytics.ts
│   │   └── firebase/
│   │       └── firebase.ts
│   │
│   ├── hooks/                    # Shared hooks
│   │   ├── useAsyncStorage.ts
│   │   └── useTheme.ts
│   │
│   └── utils/                    # Pure utility functions
│       └── formatters.ts
│
└── styles/                       # Tailwind configuration
    └── tailwind.config.js
```

---

## Implementation Plan (13 Steps)

### Phase 1: Foundation Setup

#### Step 1: Tailwind Configuration & Design Tokens

**Files to create/modify:**

- `tailwind.config.js` (update with design tokens)
- `global.css` (if needed for web)
- Delete: `src/constants/Colors.ts`, `src/constants/Fonts.ts`

**Actions:**

1. Extend Tailwind config with custom colors matching current `Colors.ts`
2. Add custom font families matching current fonts
3. Define spacing, border-radius, shadows consistent with current design
4. Configure NativeWind properly for all platforms

**Tailwind color mapping:**

```js
colors: {
  primary: '#007AFF',      // buttonBlue
  accent: '#FF6B35',       // orange
  success: '#34C759',      // green
  error: '#FF3B30',        // red
  background: '#F5F5F5',   // bg
  surface: '#FFFFFF',
  text: {
    primary: '#000000',
    secondary: '#666666',  // darkGray
  }
}
```

---

### Phase 2: Shared Layer

#### Step 2: Supabase Client Wrapper

**Files to create:**

- `src/shared/lib/supabase/client.ts`
- `src/shared/lib/supabase/types.ts` (generated from schema)

**Actions:**

1. Move Supabase client initialization
2. Create typed client with proper error handling
3. Add helper functions for common patterns (pagination, error handling)
4. Delete: `src/config/supabaseClient.ts`

---

#### Step 3: Shared UI Components (Migrate & Reorganize)

**Files to create/move:**

- `src/shared/ui/index.ts` (barrel export)
- Move existing `src/components/ui/*` to `src/shared/ui/`
- Keep platform variants: `.web.tsx`, `.native.tsx`

**Actions:**

1. Move gluestack-ui based components to `src/shared/ui/`
2. Ensure all components use Tailwind classes consistently (remove any `StyleSheet.create()`)
3. Add `clsx` for conditional class merging
4. Create barrel export `index.ts`
5. Update imports across codebase

---

#### Step 4: Shared Layouts & Hooks

**Files to create:**

- `src/shared/layouts/SafeAreaView.tsx`
- `src/shared/layouts/ScrollView.tsx`
- `src/shared/layouts/Header.tsx`
- `src/shared/hooks/useAsyncStorage.ts`

**Actions:**

1. Create layout wrappers with consistent Tailwind styling
2. Migrate async storage utilities
3. Delete: old layout components from `src/components/ui/`

---

### Phase 3: Feature Modules (Core)

#### Step 5: Auth Feature

**Files to create:**

- `src/features/auth/types.ts`
- `src/features/auth/api/authApi.ts`
- `src/features/auth/store/authStore.ts`
- `src/features/auth/hooks/useAuth.ts`
- `src/features/auth/components/LoginForm.tsx`
- `src/features/auth/components/RegistrationForm.tsx`
- `src/features/auth/index.ts`

**Actions:**

1. Define auth types (User, Session, AuthState)
2. Create authApi with Supabase auth methods
3. Migrate authStore, refactor to use authApi
4. Create useAuth hook that exposes store actions
5. Rewrite login/registration forms with Tailwind
6. Update `src/app/auth/*` to use new feature

**Delete after migration:**

- `src/utils/authUtils.ts`
- `src/components/screens/LoginScreen/`

---

#### Step 6: Courses Feature

**Files to create:**

- `src/features/courses/types.ts`
- `src/features/courses/api/coursesApi.ts`
- `src/features/courses/store/coursesStore.ts`
- `src/features/courses/hooks/useCourses.ts`
- `src/features/courses/components/CourseCard.tsx`
- `src/features/courses/components/CourseList.tsx`
- `src/features/courses/components/CourseDetail.tsx`
- `src/features/courses/index.ts`

**Actions:**

1. Define Course, Module types
2. Create coursesApi wrapping Supabase queries
3. Migrate courseStore to use new API layer
4. Rewrite components with Tailwind
5. Update `src/app/courses/*` and tabs

**Delete after migration:**

- `src/services/courses.ts`
- `src/stores/courseStore.ts`
- `src/components/screens/CoursesScreen/`
- `src/constants/types/course.ts`

---

#### Step 7: Modules Feature

**Files to create:**

- `src/features/modules/types.ts`
- `src/features/modules/api/modulesApi.ts`
- `src/features/modules/store/modulesStore.ts`
- `src/features/modules/hooks/useModules.ts`
- `src/features/modules/components/ModuleCard.tsx`
- `src/features/modules/components/ModulesList.tsx`
- `src/features/modules/index.ts`

**Actions:**

1. Define Module types
2. Create modulesApi
3. Migrate modulesStore
4. Rewrite module components with Tailwind

**Delete after migration:**

- `src/services/modules.ts`
- `src/stores/modulesStore.ts`
- `src/components/screens/ModulesScreen/`

---

#### Step 8: Lessons Feature (Slides)

**Files to create:**

- `src/features/lessons/types.ts`
- `src/features/lessons/api/lessonsApi.ts`
- `src/features/lessons/api/slidesApi.ts`
- `src/features/lessons/store/lessonsStore.ts`
- `src/features/lessons/store/slidesStore.ts`
- `src/features/lessons/hooks/useLesson.ts`
- `src/features/lessons/hooks/useSlides.ts`
- `src/features/lessons/components/LessonPlayer.tsx`
- `src/features/lessons/components/slides/TextSlide.tsx`
- `src/features/lessons/components/slides/QuizSlide.tsx`
- `src/features/lessons/components/slides/VideoSlide.tsx`
- `src/features/lessons/components/slides/VideoSlide.web.tsx`
- `src/features/lessons/components/slides/AIChatSlide.tsx`
- `src/features/lessons/index.ts`

**Actions:**

1. Define Lesson, Slide, SlideData types
2. Create API layers for lessons and slides
3. Migrate stores
4. Rewrite all slide components with Tailwind
5. Keep platform-specific video player files (.web.tsx, .native.tsx)

**Delete after migration:**

- `src/services/lessons.ts`
- `src/stores/lessonsStore.ts`, `slidesStore.ts`
- `src/components/screens/ModuleScreen/` (entire folder)

---

### Phase 4: Feature Modules (Supporting)

#### Step 9: Progress Feature

**Files to create:**

- `src/features/progress/types.ts`
- `src/features/progress/api/progressApi.ts`
- `src/features/progress/store/progressStore.ts`
- `src/features/progress/hooks/useProgress.ts`
- `src/features/progress/components/ProgressCard.tsx`
- `src/features/progress/components/ProgressList.tsx`
- `src/features/progress/index.ts`

**Actions:**

1. Define Progress types
2. Create progressApi
3. Migrate progress store (combine userProgressStore patterns)
4. Handle AsyncStorage sync properly
5. Rewrite components with Tailwind

**Delete after migration:**

- `src/utils/progressAsyncStorage.ts`
- Related stores

---

#### Step 10: Profile & Company Features

**Files to create:**

- `src/features/profile/` (full structure)
- `src/features/company/` (full structure)

**Actions:**

1. Migrate profile components and logic
2. Migrate company code logic
3. Rewrite with Tailwind

**Delete after migration:**

- `src/components/screens/ProfileScreen/`
- `src/constants/types/company.ts`

---

#### Step 11: Statistics Feature

**Files to create:**

- `src/features/statistics/` (full structure)

**Actions:**

1. Migrate statistics components
2. Keep recharts/victory-native for charts
3. Rewrite layout with Tailwind

**Delete after migration:**

- `src/components/screens/Statistics/`
- `src/constants/types/skill.ts`

---

### Phase 5: Cleanup & Polish

#### Step 12: Analytics & Firebase Consolidation

**Files to create:**

- `src/shared/lib/amplitude/analytics.ts`
- `src/shared/lib/firebase/firebase.ts`

**Actions:**

1. Move analytics initialization to shared lib
2. Create typed analytics event helpers
3. Delete: `src/amplitude.ts`, `src/firebase.ts`

---

#### Step 13: Final Cleanup

**Actions:**

1. Delete empty folders
2. Remove unused dependencies from package.json
3. Update all imports throughout `src/app/`
4. Fix any TypeScript errors
5. Update path aliases in tsconfig if needed
6. Verify app runs on all platforms

---

## Critical Files to Modify

### Route Files (update imports only)

- `src/app/_layout.tsx`
- `src/app/(tabs)/_layout.tsx`
- `src/app/(tabs)/courses.tsx`
- `src/app/(tabs)/progress.tsx`
- `src/app/(tabs)/profile.tsx`
- `src/app/auth/login.tsx`
- `src/app/auth/registration.tsx`
- `src/app/courses/[id].tsx`
- `src/app/module/[moduleId].tsx`
- `src/app/statistics/*`

### Config Files

- `package.json` - update scripts, add clsx
- `tailwind.config.js` - add design tokens
- `tsconfig.json` - update path aliases

---

## Dependencies to Add

```json
{
  "dependencies": {
    "clsx": "^2.1.0"
  }
}
```

---

## Dependencies to Consider Removing

- Redundant icon packages (consolidate to lucide-react-native only)
- Unused @gluestack-ui sub-packages

---

## Migration Strategy

Each step should:

1. Create new feature structure
2. Migrate functionality incrementally
3. Update route files to use new imports
4. Verify app still works
5. Delete old files only after verification

This ensures the app remains functional throughout the refactoring process.

---

## Estimated Complexity per Step

| Step                | Complexity | Est. Files        |
| ------------------- | ---------- | ----------------- |
| 1. Tailwind Config  | Low        | 3                 |
| 2. Supabase Wrapper | Low        | 2                 |
| 3. UI Components    | Low        | 5 (mostly moving) |
| 4. Layouts & Hooks  | Low        | 5                 |
| 5. Auth Feature     | Medium     | 7                 |
| 6. Courses Feature  | Medium     | 8                 |
| 7. Modules Feature  | Medium     | 7                 |
| 8. Lessons Feature  | High       | 15+               |
| 9. Progress Feature | Medium     | 7                 |
| 10. Profile/Company | Medium     | 10                |
| 11. Statistics      | Medium     | 6                 |
| 12. Analytics       | Low        | 3                 |
| 13. Cleanup         | Low        | -                 |

---

## Notes

- Steps 1-4 form the foundation and should be done first
- Steps 5-8 are the core features and most complex
- Steps 9-11 can be parallelized
- Each step is designed to be executable by an LLM in a single session
- The app should remain functional after each step completion
