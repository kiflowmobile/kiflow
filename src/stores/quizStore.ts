import { create } from 'zustand';
import { supabase } from '@/src/config/supabaseClient';
import { useAuthStore } from './authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getAuthStore = () => require('./authStore').useAuthStore;


interface QuizData {
  selectedAnswer: number;
  correctAnswer: number;
}

interface QuizStore {
  quizProgress: Record<string, QuizData>;
  setQuizAnswer: (quizId: string, selectedAnswer: number, correctAnswer: number) => void;
  loadFromLocalStorage: () => void;
  saveToLocalStorage: () => void;
  syncQuizToDB: () => Promise<void>;
  clearQuizProgress: () => void;
  syncQuizFromDBToLocalStorage: () => void

  getModuleScore: (courseId: string, moduleId: string) => Promise<number>;
  getCourseScore: (courseId: string) => Promise<number>;
  getTotalScore: () => Promise<number>;
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  quizProgress: {},

  setQuizAnswer: (quizId, selectedAnswer, correctAnswer) => {
    const updated = {
      ...get().quizProgress,
      [quizId]: { selectedAnswer, correctAnswer },
    };
    set({ quizProgress: updated });
    localStorage.setItem('quizProgress', JSON.stringify(updated));
  },

  loadFromLocalStorage: () => {
    const saved = localStorage.getItem('quizProgress');
    if (saved) {
      set({ quizProgress: JSON.parse(saved) });
    }
  },

  saveToLocalStorage: () => {
    const data = get().quizProgress;
    localStorage.setItem('quizProgress', JSON.stringify(data));
  },

  syncQuizToDB: async () => {
    console.log('syncQuizToDB')
    const { user } = getAuthStore().getState();
    if(!user) return
    try {
    const allKeys = await AsyncStorage.getAllKeys();
    const quizKeys = allKeys.filter((k) => k.startsWith('quiz-progress-'));


    if (quizKeys.length === 0) {
      return;
    }
    const keyValues = await AsyncStorage.multiGet(quizKeys);
    const rows: any[] = [];

    for (const [key, value] of keyValues) {
      if (!value) continue;

      let parsed;
      try {
        parsed = JSON.parse(value);
      } catch (err) {
        console.warn(`❌ Failed to parse quiz data for key ${key}`, err);
        continue;
      }
      for (const [slideId, data] of Object.entries(parsed)) {
        const { selectedAnswer, correctAnswer } = data as any;
        if (
          typeof selectedAnswer !== 'number' ||
          typeof correctAnswer !== 'number'
        ) {
          console.warn(`⚠️ Invalid quiz entry for slide ${slideId}`, data);
          continue;
        }
        rows.push({
          user_id: user.id,
          slide_id: slideId,
          interaction_type: 'quiz',
          data: {
            selected_answer: selectedAnswer,
            correct_answer: correctAnswer
          }
        });
      }
    }

    if (rows.length === 0) {
        // console.log('ℹ️ No valid quiz rows to sync');
        return;
    }

    const { error } = await supabase
      .from('user_slide_interactions')
      .upsert(rows, { onConflict: 'user_id,slide_id,interaction_type' });
    if (error) throw error;

    } catch (err) {
      console.error('❌ Failed to sync quiz progress:', err);
    }
  },


  syncQuizFromDBToLocalStorage: async () => {
    try {
      const { user } = getAuthStore().getState();
      if (!user) return;
        const { data, error } = await supabase
        .from('user_slide_interactions')
        .select(`
          slide_id,
          data,
          slides!inner(
            lessons!inner(
              modules!inner(course_id)
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('interaction_type', 'quiz');

      if (error) throw error;
      if (!data || data.length === 0) return;

      const groupedByCourse: Record<
        string,
        Record<string, { selectedAnswer: number; correctAnswer: number }>
      > = {};

      for (const item of data) {
        const courseId = (item.slides as any)?.lessons?.modules?.course_id;
        if (!courseId) continue;
        const key = `quiz-progress-${courseId}`;
        if (!groupedByCourse[key]) groupedByCourse[key] = {};
        groupedByCourse[key][item.slide_id] = {
          selectedAnswer: item.data?.selected_answer,
          correctAnswer: item.data?.correct_answer,
        };
      }
        const allKeys = await AsyncStorage.getAllKeys();

      const pairs: [string, string][] = [];

      for (const [key, newData] of Object.entries(groupedByCourse)) {
        let mergedData = { ...newData };

        if (allKeys.includes(key)) {
          const existingValue = await AsyncStorage.getItem(key);
          if (existingValue) {
            try {
              const parsed = JSON.parse(existingValue);
              mergedData = { ...parsed, ...newData };
            } catch {
            }
          }
        }

        pairs.push([key, JSON.stringify(mergedData)]);
      }

      if (pairs.length > 0) {
        await AsyncStorage.multiSet(pairs);
      }
    } catch (err) {
      console.error('❌ Failed to sync quiz data from DB:', err);
    }
  },

  clearQuizProgress: () => {
    set({ quizProgress: {} });
    localStorage.removeItem('quizProgress');
  },

  getModuleScore: async (courseId: string, moduleId: string) => {
    const key = `quiz-progress-${courseId}`;
    const value = await AsyncStorage.getItem(key);
    if (!value) return 0;

    const data = Object.values(JSON.parse(value)) as QuizData[];

    const correct = data.filter(
      (q) => q.selectedAnswer === q.correctAnswer
    ).length;

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

    return totalQuestions === 0
      ? 0
      : (totalCorrect / totalQuestions) *5;
  },
}));
