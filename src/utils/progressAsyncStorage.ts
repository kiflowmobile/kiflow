import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserCourseSummary } from '../constants/types/progress';


const STORAGE_KEY = (userId: string) => `progress_${userId}`;

export const saveProgressLocal = async (userId: string, courses: UserCourseSummary[]) => {
  await AsyncStorage.setItem(STORAGE_KEY(userId), JSON.stringify(courses));
};

export const loadProgressLocal = async (userId: string): Promise<UserCourseSummary[]> => {
  const data = await AsyncStorage.getItem(STORAGE_KEY(userId));
  return data ? JSON.parse(data) : [];
};

