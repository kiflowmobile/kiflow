export interface ModuleProgress {
  module_id: string;
  progress: number;
  last_slide_id: string | null;
  total_slides?: number;
}

export interface UserCourseSummary {
  course_id: string;
  progress: number;
  last_slide_id?: string | null;
  modules: ModuleProgress[];
}

export interface UserModuleProgressDB {
  id?: string;
  user_id: string;
  module_id: string;
  progress: number;
  last_slide_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProgressState {
  courses: UserCourseSummary[];
  isLoading: boolean;
  error: string | null;
}

export interface ProgressActions {
  initFromLocal: () => Promise<void>;
  fetchUserProgress: (userId: string) => Promise<void>;
  setCourseProgress: (courseId: string, progress: number, lastSlideId?: string | null) => void;
  getCourseProgress: (courseId: string) => number;
  setModuleProgressSafe: (
    courseId: string,
    moduleId: string,
    currentSlideIndex: number,
    totalSlides: number,
    lastSlideId?: string | null,
  ) => Promise<void>;
  getModuleProgress: (courseId: string, moduleId: string) => number;
  syncProgressToDB: () => Promise<void>;
  syncProgressFromDBToLocalStorage: () => Promise<void>;
  resetCourseProgress: (courseId: string) => Promise<void>;
}

export type ProgressStore = ProgressState & ProgressActions;
