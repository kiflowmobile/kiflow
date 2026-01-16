# Required App Code Changes for Schema Simplification

After running `20260116100000_schema_simplification.sql`, the following app code changes are required.

---

## Summary of Database Changes

| Before | After |
|--------|-------|
| `courses.code` | **REMOVED** |
| `users.current_code` | **REMOVED** |
| `quiz_answers` table | **MERGED** into `user_slide_interactions` |
| `chat_history` table | **MERGED** into `user_slide_interactions` |
| `main_rating` table | **RENAMED** to `user_skill_ratings` |
| `criterias` table | **RENAMED** to `criteria` |

---

## Files to Update

### 1. Remove `current_code` references

#### `src/services/users.ts`
- **DELETE** the function `getCurrentUserCode` (lines 107-125)
- Or update it to query `company_members` instead

#### `src/services/company.ts`
- **REMOVE** lines 178-186 that update `current_code`:
```typescript
// DELETE THIS:
const { error: updateError } = await supabase
  .from('users')
  .update({ current_code: code })
  .eq('id', user.id);
```

#### `src/constants/types/user.ts`
- **REMOVE** `current_code` from the User interface:
```typescript
// DELETE THIS LINE:
current_code?: string | null;
```

---

### 2. Update Quiz Store (quiz_answers → user_slide_interactions)

#### `src/stores/quizStore.ts`
Replace all `.from('quiz_answers')` with `.from('user_slide_interactions')` and update the data structure:

**Before:**
```typescript
await supabase.from('quiz_answers').upsert({
  user_id,
  slide_id,
  course_id,
  module_id,
  selected_answer,
  correct_answer
});
```

**After:**
```typescript
await supabase.from('user_slide_interactions').upsert({
  user_id,
  slide_id,
  course_id,
  module_id,
  interaction_type: 'quiz',
  data: { selected_answer, correct_answer }
}, { onConflict: 'user_id,slide_id,interaction_type' });
```

**Reading data - Before:**
```typescript
const { data } = await supabase
  .from('quiz_answers')
  .select('selected_answer, correct_answer')
  .eq('user_id', userId);
```

**After:**
```typescript
const { data } = await supabase
  .from('user_slide_interactions')
  .select('data')
  .eq('user_id', userId)
  .eq('interaction_type', 'quiz');

// Access: data[0].data.selected_answer, data[0].data.correct_answer
```

#### `src/services/quizService.ts`
Same changes as quizStore - update table name and data structure.

---

### 3. Update Chat Store (chat_history → user_slide_interactions)

#### `src/stores/chatStore.ts`
Replace all `.from('chat_history')` with `.from('user_slide_interactions')`:

**Before:**
```typescript
await supabase.from('chat_history').upsert({
  user_id,
  slide_id,
  course_id,
  messages
});
```

**After:**
```typescript
await supabase.from('user_slide_interactions').upsert({
  user_id,
  slide_id,
  course_id,
  interaction_type: 'ai_chat',
  data: { messages }
}, { onConflict: 'user_id,slide_id,interaction_type' });
```

**Reading data - After:**
```typescript
const { data } = await supabase
  .from('user_slide_interactions')
  .select('data')
  .eq('user_id', userId)
  .eq('slide_id', slideId)
  .eq('interaction_type', 'ai_chat')
  .single();

const messages = data?.data?.messages || [];
```

---

### 4. Rename main_rating → user_skill_ratings

#### `src/services/main_rating.ts`
- **RENAME** file to `src/services/userSkillRatings.ts` (optional but recommended)
- Replace all `.from('main_rating')` with `.from('user_skill_ratings')`

```typescript
// Before:
.from('main_rating')

// After:
.from('user_skill_ratings')
```

#### `src/stores/mainRatingStore.ts`
- **RENAME** file to `src/stores/userSkillRatingsStore.ts` (optional)
- Update import path if service file renamed
- Replace all `.from('main_rating')` with `.from('user_skill_ratings')`

#### `src/app/api/email/send-course-completion+api.ts`
- Update import if service file renamed

#### `src/app/api/email/send-last-slide+api.ts`
- Update import if service file renamed

---

### 5. Rename criterias → criteria

#### `src/services/criteriaService.ts`
Replace:
```typescript
.from('criterias')
```
With:
```typescript
.from('criteria')
```

#### `src/stores/criterias.ts`
- **RENAME** file to `src/stores/criteriaStore.ts` (optional)
- Replace all `.from('criterias')` with `.from('criteria')`

#### `src/services/main_rating.ts` (line 65)
```typescript
// Before:
.from('criterias')

// After:
.from('criteria')
```

---

## New TypeScript Types

Add these types to your types folder:

```typescript
// src/constants/types/interactions.ts

export type InteractionType = 'quiz' | 'ai_chat';

export interface QuizInteractionData {
  selected_answer: number;
  correct_answer: number;
}

export interface AiChatInteractionData {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface UserSlideInteraction {
  id: string;
  user_id: string;
  slide_id: string;
  course_id?: string;
  module_id?: string;
  interaction_type: InteractionType;
  data: QuizInteractionData | AiChatInteractionData;
  created_at: string;
  updated_at?: string;
}
```

---

## Search & Replace Summary

| Find | Replace |
|------|---------|
| `from('quiz_answers')` | `from('user_slide_interactions')` |
| `from('chat_history')` | `from('user_slide_interactions')` |
| `from('main_rating')` | `from('user_skill_ratings')` |
| `from('criterias')` | `from('criteria')` |
| `current_code` | *DELETE* |

---

## Testing Checklist

After making changes, test these flows:

- [ ] User can complete a quiz and answer is saved
- [ ] User can resume a quiz and see previous answer
- [ ] AI chat messages are saved and restored
- [ ] Progress/statistics screens show correct data
- [ ] Skill ratings are saved and displayed correctly
- [ ] Course completion email includes skill ratings
- [ ] User can join company by code (without current_code update)

---

## Optional: Create Migration Helper Service

Consider creating a unified service for the new table:

```typescript
// src/services/slideInteractions.ts

export const slideInteractionService = {
  // Quiz methods
  saveQuizAnswer: async (userId, slideId, courseId, moduleId, selected, correct) => {
    return supabase.from('user_slide_interactions').upsert({
      user_id: userId,
      slide_id: slideId,
      course_id: courseId,
      module_id: moduleId,
      interaction_type: 'quiz',
      data: { selected_answer: selected, correct_answer: correct }
    }, { onConflict: 'user_id,slide_id,interaction_type' });
  },

  getQuizAnswer: async (userId, slideId) => {
    const { data } = await supabase
      .from('user_slide_interactions')
      .select('data')
      .eq('user_id', userId)
      .eq('slide_id', slideId)
      .eq('interaction_type', 'quiz')
      .single();
    return data?.data;
  },

  // Chat methods
  saveChatHistory: async (userId, slideId, courseId, messages) => {
    return supabase.from('user_slide_interactions').upsert({
      user_id: userId,
      slide_id: slideId,
      course_id: courseId,
      interaction_type: 'ai_chat',
      data: { messages }
    }, { onConflict: 'user_id,slide_id,interaction_type' });
  },

  getChatHistory: async (userId, slideId) => {
    const { data } = await supabase
      .from('user_slide_interactions')
      .select('data')
      .eq('user_id', userId)
      .eq('slide_id', slideId)
      .eq('interaction_type', 'ai_chat')
      .single();
    return data?.data?.messages || [];
  }
};
```
