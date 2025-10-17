import { create } from 'zustand';
import { supabase } from '@/src/config/supabaseClient';
import { useAuthStore } from './authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

export const useQuizStore = create<QuizStore>((set, get) => ({
  quizProgress: {},

  // ✅ Встановлення відповіді для конкретного запитання
  setQuizAnswer: (quizId, selectedAnswer, correctAnswer) => {
    const updated = {
      ...get().quizProgress,
      [quizId]: { selectedAnswer, correctAnswer },
    };
    set({ quizProgress: updated });
    localStorage.setItem('quizProgress', JSON.stringify(updated));
  },

  // ✅ Завантаження з localStorage при старті
  loadFromLocalStorage: () => {
    const saved = localStorage.getItem('quizProgress');
    if (saved) {
      set({ quizProgress: JSON.parse(saved) });
    }
  },

  // ✅ Збереження в localStorage
  saveToLocalStorage: () => {
    const data = get().quizProgress;
    localStorage.setItem('quizProgress', JSON.stringify(data));
  },

  // ✅ Синхронізація з БД перед виходом
  syncQuizToDB: async () => {
    const { user } = useAuthStore.getState();
    if(!user) return

    try {


    const allKeys = await AsyncStorage.getAllKeys();
    const quizKeys = allKeys.filter((k) => k.startsWith('course-progress-'));

    if (quizKeys.length === 0) {
      console.log('No local quiz data to sync');
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
          selected_answer: selectedAnswer,
          correct_answer: correctAnswer,
        });
      }
    }

    if (rows.length === 0) {
        console.log('ℹ️ No valid quiz rows to sync');
        return;
    }
  
    const { error } = await supabase.from('quiz_answers').upsert(rows, { onConflict: 'user_id,slide_id' });;
    if (error) throw error;
    await AsyncStorage.multiRemove(quizKeys);

    } catch (err) {
      console.error('❌ Failed to sync quiz progress:', err);
    }
  },

  clearQuizProgress: () => {
    set({ quizProgress: {} });
    localStorage.removeItem('quizProgress');
  },
}));
