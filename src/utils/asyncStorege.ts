import AsyncStorage from "@react-native-async-storage/async-storage";

export const clearUserLocalData = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
  
      const keysToRemove = allKeys.filter((key) =>
        key.startsWith('course-progress-') ||
        key.startsWith('course-chat-') ||
        key.startsWith('user-progress-') ||
        key.startsWith('quizProgress') ||
        key.startsWith('lesson-progress-') ||
        key.startsWith('progress_')
      );
  
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      } else {
        console.log('ℹ️ No user-related local data found to clear');
      }
    } catch (err) {
      console.error('❌ Failed to clear local user data:', err);
    }
  };