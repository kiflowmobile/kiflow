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
  syncQuizFromDBToLocalStorage: () => void
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
      const courseId = key.replace("course-progress-", "");
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
          course_id: courseId
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


  syncQuizFromDBToLocalStorage: async () => {
    try {
      const { user } = useAuthStore.getState();
      if (!user) return;
  
      // 1️⃣ Отримуємо відповіді користувача з БД
      const { data, error } = await supabase
        .from('quiz_answers')
        .select('slide_id, selected_answer, correct_answer, course_id')
        .eq('user_id', user.id);
  
      if (error) throw error;
      if (!data || data.length === 0) {
        console.log('ℹ️ No quiz data in DB for this user');
        return;
      }
  
      const groupedByCourse: Record<
        string,
        Record<string, { selectedAnswer: number; correctAnswer: number }>
      > = {};
  
      for (const item of data) {
        const key = `course-progress-${item.course_id}`;
        if (!groupedByCourse[key]) groupedByCourse[key] = {};
        groupedByCourse[key][item.slide_id] = {
          selectedAnswer: item.selected_answer,
          correctAnswer: item.correct_answer,
        };
      }
  
      // 3️⃣ Отримуємо всі ключі з локального сховища
      const allKeys = await AsyncStorage.getAllKeys();
  
      // 4️⃣ Якщо є збережені дані для курсу — об’єднуємо
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
              // якщо старі дані некоректні — просто перезаписуємо
            }
          }
        }
  
        pairs.push([key, JSON.stringify(mergedData)]);
      }
  
      // 5️⃣ Зберігаємо все разом — 1 запит на курс
      if (pairs.length > 0) {
        await AsyncStorage.multiSet(pairs);
      }
  
      console.log(`✅ Synced quiz data for ${pairs.length} course(s) from DB → local storage`);
    } catch (err) {
      console.error('❌ Failed to sync quiz data from DB:', err);
    }
  },

  clearQuizProgress: () => {
    set({ quizProgress: {} });
    localStorage.removeItem('quizProgress');
  },
}));
