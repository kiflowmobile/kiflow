import AsyncStorage from "@react-native-async-storage/async-storage";


export const clearUserLocalData = async (options?: { keepProgress?: boolean }) => {
  const keepProgress = options?.keepProgress ?? false;

  try {
    const allKeys = await AsyncStorage.getAllKeys();

    const keysToRemove = allKeys.filter((key) => {
      const match =
        key.startsWith("quiz-progress-") ||
        key.startsWith("course-chat-") ||
        key.startsWith("user-progress-") ||
        key.startsWith("quizProgress") ||
        key.startsWith("lesson-progress-") ||
        key.startsWith("progress_");

      if (!match) return false;

      if (keepProgress && key.startsWith("progress_")) {
        return false;
      }

      return true;
    });

    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
    }
  } catch (err) {
    console.error("❌ Failed to clear local user data:", err);
  }
};
