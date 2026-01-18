import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserCourseSummary } from '../types';

const STORAGE_KEY = (userId: string) => `progress_${userId}`;

/**
 * Save progress data to local storage
 */
export const saveProgressLocal = async (
  userId: string,
  courses: UserCourseSummary[],
): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY(userId), JSON.stringify(courses));
  } catch (error) {
    console.error('Failed to save progress to local storage:', error);
  }
};

/**
 * Load progress data from local storage
 */
export const loadProgressLocal = async (userId: string): Promise<UserCourseSummary[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY(userId));
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to load progress from local storage:', error);
    return [];
  }
};

/**
 * Clear progress data from local storage
 */
export const clearProgressLocal = async (userId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY(userId));
  } catch (error) {
    console.error('Failed to clear progress from local storage:', error);
  }
};
