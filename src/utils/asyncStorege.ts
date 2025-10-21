import AsyncStorage from "@react-native-async-storage/async-storage";

export const clearUserLocalData = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
  
      // 🔹 Визначаємо ключі, які треба видалити
      const keysToRemove = allKeys.filter((key) =>
        key.startsWith('course-progress-') ||
        key.startsWith('course-chat-') ||
        key.startsWith('user-progress-') ||
        key.startsWith('quizProgress') ||
        key.startsWith('lesson-progress-')
      );
  
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log(`🧹 Cleared ${keysToRemove.length} user-related keys from AsyncStorage`);
      } else {
        console.log('ℹ️ No user-related local data found to clear');
      }
    } catch (err) {
      console.error('❌ Failed to clear local user data:', err);
    }
  };