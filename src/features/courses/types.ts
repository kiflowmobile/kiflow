import type { Module } from '@/src/features/modules/types';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  image: string | null;
  is_public: boolean;
  contact_email: string | null;
  created_at: string;
  modules?: Module[];
}

export interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  isLoading: boolean;
  error: string | null;
}

export interface CourseActions {
  fetchCourses: () => Promise<void>;
  fetchCourseById: (id: string) => Promise<Course | null>;
  setCurrentCourse: (course: Course | null) => void;
  clearError: () => void;
  refreshCourses: () => Promise<void>;
  setCourses: (courses: Course[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export type CourseStore = CourseState & CourseActions;

export interface CourseSelectionProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  selectedCourseId?: string;
  onRefresh?: () => Promise<void>;
}

export interface CompanyCourse {
  company_id: string;
  course_id: string;
}
