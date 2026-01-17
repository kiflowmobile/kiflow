import { useUserSkillRatingsStore } from '../store/ratingsStore';
import { useCriteriaStore } from '../store/criteriaStore';

/**
 * Hook to access skill ratings state and actions
 */
export function useSkillRatings() {
  const average = useUserSkillRatingsStore((state) => state.average);
  const ratings = useUserSkillRatingsStore((state) => state.ratings);
  const skills = useUserSkillRatingsStore((state) => state.skills);
  const isLoading = useUserSkillRatingsStore((state) => state.isLoading);
  const error = useUserSkillRatingsStore((state) => state.error);

  const fetchAverage = useUserSkillRatingsStore((state) => state.fetchAverage);
  const fetchSkills = useUserSkillRatingsStore((state) => state.fetchSkills);
  const saveRating = useUserSkillRatingsStore((state) => state.saveRating);
  const fetchUserAverage = useUserSkillRatingsStore(
    (state) => state.fetchUserAverage
  );
  const fetchUserRatings = useUserSkillRatingsStore(
    (state) => state.fetchUserRatings
  );
  const clear = useUserSkillRatingsStore((state) => state.clear);

  return {
    // State
    average,
    ratings,
    skills,
    isLoading,
    error,

    // Actions
    fetchAverage,
    fetchSkills,
    saveRating,
    fetchUserAverage,
    fetchUserRatings,
    clear,
  };
}

/**
 * Hook to access criteria state and actions
 */
export function useCriteria() {
  const criteria = useCriteriaStore((state) => state.criteria);
  const isLoading = useCriteriaStore((state) => state.isLoading);
  const error = useCriteriaStore((state) => state.error);

  const fetchCriteria = useCriteriaStore((state) => state.fetchCriteria);
  const fetchAllCriteria = useCriteriaStore((state) => state.fetchAllCriteria);
  const clear = useCriteriaStore((state) => state.clear);

  return {
    // State
    criteria,
    isLoading,
    error,

    // Actions
    fetchCriteria,
    fetchAllCriteria,
    clear,
  };
}
