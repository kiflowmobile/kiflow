import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAsyncStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadValue = async () => {
      try {
        const item = await AsyncStorage.getItem(key);
        if (item !== null) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error(`Error loading ${key} from AsyncStorage:`, error);
      } finally {
        setLoading(false);
      }
    };
    loadValue();
  }, [key]);

  const setValue = useCallback(
    async (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error saving ${key} to AsyncStorage:`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing ${key} from AsyncStorage:`, error);
    }
  }, [key, initialValue]);

  return { value: storedValue, setValue, removeValue, loading };
}

// Utility functions for common AsyncStorage operations
export const asyncStorageUtils = {
  async clearUserLocalData(): Promise<void> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter(
        (key) =>
          key.startsWith('quiz-progress-') ||
          key.startsWith('course-chat-') ||
          key.startsWith('user-progress-') ||
          key.startsWith('quizProgress') ||
          key.startsWith('lesson-progress-') ||
          key.startsWith('progress_')
      );

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
    } catch (err) {
      console.error('Failed to clear local user data:', err);
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting ${key}:`, error);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  },
};
