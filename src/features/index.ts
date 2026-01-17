// Re-export all features for convenient imports
// Example: import { useAuth, useCourses } from '@/src/features';

// Auth
export * from './auth';

// Courses
export * from './courses';

// Modules
export * from './modules';

// Lessons (includes slides)
export * from './lessons';

// Progress
export * from './progress';

// Profile - exclude User to avoid conflict with auth
export { profileApi, useProfile, type UserUpdateData } from './profile';

// Company
export * from './company';

// Statistics (includes criteria and ratings)
export * from './statistics';
