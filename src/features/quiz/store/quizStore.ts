import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { quizApi, type QuizInteractionRow } from '../api/quizApi';

// Lazy import to avoid circular dependency
const getAuthStore = () => require('@/features/auth').useAuthStore;

export interface QuizData {
  selectedAnswer: number;
  correctAnswer: number;
}

export interface QuizState {
  quizProgress: Record<string, QuizData>;
}

export interface QuizActions {
  setQuizAnswer: (quizId: string, selectedAnswer: number, correctAnswer: number) => void;
  loadFromLocalStorage: () => Promise<void>;
  saveToLocalStorage: () => Promise<void>;
  syncQuizToDB: () => Promise<void>;
  syncQuizFromDBToLocalStorage: () => Promise<void>;
  clearQuizProgress: () => Promise<void>;
  getModuleScore: (courseId: string, moduleId: string) => Promise<number>;
  getCourseScore: (courseId: string) => Promise<number>;
  getTotalScore: () => Promise<number>;
}

export type QuizStore = QuizState & QuizActions;

export const useQuizStore = create<QuizStore>((set, get) => ({
  quizProgress: {},

  setQuizAnswer: async (quizId, selectedAnswer, correctAnswer) => {
    const updated = {
      ...get().quizProgress,
      [quizId]: { selectedAnswer, correctAnswer },
    };
    set({ quizProgress: updated });
    await AsyncStorage.setItem('quizProgress', JSON.stringify(updated));
  },

  loadFromLocalStorage: async () => {
    const saved = await AsyncStorage.getItem('quizProgress');
    if (saved) {
      set({ quizProgress: JSON.parse(saved) });
    }
  },

  saveToLocalStorage: async () => {
    const data = get().quizProgress;
    await AsyncStorage.setItem('quizProgress', JSON.stringify(data));
  },

  syncQuizToDB: async () => {
    const { user } = getAuthStore().getState();
    if (!user) return;

    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const quizKeys = allKeys.filter((k) => k.startsWith('quiz-progress-'));
      if (quizKeys.length === 0) return;

      const keyValues = await AsyncStorage.multiGet(quizKeys);
      const rows: QuizInteractionRow[] = [];

      for (const [key, value] of keyValues) {
        if (!value) continue;

        let parsed;
        try {
          parsed = JSON.parse(value);
        } catch (err) {
          console.warn(`Failed to parse quiz data for key ${key}`, err);
          continue;
        }

        for (const [slideId, data] of Object.entries(parsed)) {
          const { selectedAnswer, correctAnswer } = data as QuizData;
          if (typeof selectedAnswer !== 'number' || typeof correctAnswer !== 'number') {
            continue;
          }
          rows.push({
            user_id: user.id,
            slide_id: slideId,
            interaction_type: 'quiz',
            data: {
              selected_answer: selectedAnswer,
              correct_answer: correctAnswer,
            },
          });
        }
      }

      const { error } = await quizApi.syncQuizAnswers(user.id, rows);
      if (error) throw error;
    } catch (err) {
      console.error('Failed to sync quiz progress:', err);
    }
  },

  syncQuizFromDBToLocalStorage: async () => {
    try {
      const { user } = getAuthStore().getState();
      if (!user) return;

      const { data, error } = await quizApi.fetchQuizInteractions(user.id);
      if (error) throw error;
      if (!data?.length) return;

      const groupedByCourse: Record<string, Record<string, QuizData>> = {};

      for (const item of data) {
        const courseId = item.slides?.lessons?.modules?.course_id;
        if (!courseId) continue;

        const key = `quiz-progress-${courseId}`;
        if (!groupedByCourse[key]) groupedByCourse[key] = {};

        groupedByCourse[key][item.slide_id] = {
          selectedAnswer: item.data?.selected_answer,
          correctAnswer: item.data?.correct_answer,
        };
      }

      const pairs: [string, string][] = [];
      const allKeys = await AsyncStorage.getAllKeys();

      for (const [key, newData] of Object.entries(groupedByCourse)) {
        let mergedData = { ...newData };

        if (allKeys.includes(key)) {
          const existingValue = await AsyncStorage.getItem(key);
          if (existingValue) {
            try {
              const parsed = JSON.parse(existingValue);
              mergedData = { ...parsed, ...newData };
            } catch {}
          }
        }

        pairs.push([key, JSON.stringify(mergedData)]);
      }

      if (pairs.length > 0) {
        await AsyncStorage.multiSet(pairs);
      }
    } catch (err) {
      console.error('Failed to sync quiz data from DB:', err);
    }
  },

  clearQuizProgress: async () => {
    set({ quizProgress: {} });
    await AsyncStorage.removeItem('quizProgress');
  },

  getModuleScore: async (courseId: string, _moduleId: string) => {
    const key = `quiz-progress-${courseId}`;
    const value = await AsyncStorage.getItem(key);
    if (!value) return 0;

    const data = Object.values(JSON.parse(value)) as QuizData[];
    if (data.length === 0) return 0;

    const correct = data.filter((q) => q.selectedAnswer === q.correctAnswer).length;
    return Math.round((correct / data.length) * 5);
  },

  getCourseScore: async (courseId) => {
    const key = `quiz-progress-${courseId}`;
    const value = await AsyncStorage.getItem(key);
    if (!value) return 0;

    const data = Object.values(JSON.parse(value)) as QuizData[];
    if (data.length === 0) return 0;

    const correct = data.filter((q) => q.selectedAnswer === q.correctAnswer).length;
    return Math.round((correct / data.length) * 5);
  },

  getTotalScore: async () => {
    const allKeys = await AsyncStorage.getAllKeys();
    const quizKeys = allKeys.filter((k) => k.startsWith('quiz-progress-'));
    if (quizKeys.length === 0) return 0;

    const keyValues = await AsyncStorage.multiGet(quizKeys);
    let totalQuestions = 0;
    let totalCorrect = 0;

    for (const [, value] of keyValues) {
      if (!value) continue;
      const data = Object.values(JSON.parse(value)) as QuizData[];
      totalQuestions += data.length;
      totalCorrect += data.filter((q) => q.selectedAnswer === q.correctAnswer).length;
    }

    return totalQuestions === 0 ? 0 : (totalCorrect / totalQuestions) * 5;
  },
}));
