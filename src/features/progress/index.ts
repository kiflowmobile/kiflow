// Store
export { useUserProgressStore } from './store/progressStore';

// Hooks
export { useUserProgress, useCourseProgress, useModuleProgress } from './hooks/useProgress';

// API
export { progressApi } from './api/progressApi';

// Utils
export { saveProgressLocal, loadProgressLocal, clearProgressLocal } from './utils/progressStorage';

// Types
export type {
  ModuleProgress,
  UserCourseSummary,
  UserModuleProgressDB,
  ProgressState,
  ProgressActions,
  ProgressStore,
} from './types';
