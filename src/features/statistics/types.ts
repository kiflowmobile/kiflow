export interface Skill {
  criterion_id: string;
  criterion_name: string;
  average_score: number;
}

export interface Criteria {
  id: string;
  module_id: string;
  course_id: string;
  name: string;
  key: string;
  description: string;
  average_score?: number;
}

export interface RatingItem {
  id: string;
  user_id: string;
  module_id: string;
  criteria_key: string;
  rating: number;
}

export interface SkillSummaryItem {
  criterion_id: string;
  criterion_name: string;
  average_score: number;
}

export interface SkillRatingsState {
  average: number | null;
  ratings: RatingItem[];
  skills: SkillSummaryItem[];
  isLoading: boolean;
  error: string | null;
}

export interface SkillRatingsActions {
  fetchAverage: (userId: string, moduleId: string) => Promise<void>;
  fetchSkills: (userId: string, moduleId: string) => Promise<void>;
  saveRating: (userId: string, rating: number, moduleId: string, key: string) => Promise<void>;
  fetchUserAverage: (userId: string) => Promise<void>;
  fetchUserRatings: (userId: string) => Promise<void>;
  clear: () => void;
}

export type SkillRatingsStore = SkillRatingsState & SkillRatingsActions;

export interface CriteriaState {
  criteria: Criteria[];
  isLoading: boolean;
  error: string | null;
}

export interface CriteriaActions {
  fetchCriteria: (courseId: string) => Promise<void>;
  fetchAllCriteria: () => Promise<void>;
  // Backwards compatibility aliases
  fetchCriterias: (courseId: string) => Promise<void>;
  fetchAllCriterias: () => Promise<void>;
  clear: () => void;
}

export type CriteriaStore = CriteriaState & CriteriaActions;
