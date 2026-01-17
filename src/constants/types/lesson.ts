// Re-export from new location for backwards compatibility
// TODO: Update imports to use @/src/features/lessons directly
import type { Lesson } from '@/src/features/lessons';

// Legacy alias (old name was "Lessons", new name is "Lesson")
export type Lessons = Lesson;
export type { Lesson };
