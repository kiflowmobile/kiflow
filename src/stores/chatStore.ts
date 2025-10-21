import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/src/config/supabaseClient';
import { useAuthStore } from '@/src/stores/authStore';
import ContentWithExample from '../components/screens/ModuleScreen/slides/ContentWithExample';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

interface ChatStore {
  syncChatFromLocalStorageToDB: () => Promise<void>;
  syncChatFromDBToLocalStorage: () => Promise<void>;
}

export const useChatStore = create<ChatStore>(() => ({
  // 🔹 Синхронізація чатів із локального сховища в базу
  syncChatFromLocalStorageToDB: async () => {
    // console.log('💬 Syncing chats from local storage → DB');

    const { user } = useAuthStore.getState();
    if (!user) return;

    try {
      // 1️⃣ Отримуємо всі ключі, що починаються з "course-chat-"
      const allKeys = await AsyncStorage.getAllKeys();
      const chatKeys = allKeys.filter((key) => key.startsWith('course-chat-'));
      if (chatKeys.length === 0) {
        console.log('ℹ️ No local chat data to sync');
        return;
      }

      // 2️⃣ Дістаємо всі значення
      const keyValues = await AsyncStorage.multiGet(chatKeys);
      const rowsToUpsert: {
        user_id: string;
        course_id: string;
        slide_id: string;
        messages: ChatMessage[];
      }[] = [];

      for (const [key, value] of keyValues) {
        if (!value) continue;

        const courseId = key.replace('course-chat-', '');
        let parsed;
        try {
          parsed = JSON.parse(value);
        } catch (err) {
          console.warn(`❌ Failed to parse chat data for key ${key}`, err);
          continue;
        }

        // parsed = { slide_id: [ {id, role, text}, ... ] }
        for (const [slide_id, messages] of Object.entries(parsed)) {
          rowsToUpsert.push({
            user_id: user.id,
            course_id: courseId,
            slide_id,
            messages: messages as ChatMessage[],
          });
        }
      }

      if (rowsToUpsert.length === 0) {
        console.log('ℹ️ No valid chat data found');
        return;
      }

console.log('rowsToUpsert', rowsToUpsert)
      // 3️⃣ UPSERT у Supabase
      const { error } = await supabase
        .from('chat_history')
        .upsert(rowsToUpsert, { onConflict: 'user_id, slide_id' });

      if (error) throw error;

      console.log(`✅ Synced ${rowsToUpsert.length} chat entries to DB`);
    } catch (err) {
      console.error('❌ Failed to sync chat data from local storage:', err);
    }

    
  },

  syncChatFromDBToLocalStorage: async () => {
    try{
        const { user } = useAuthStore.getState();
        if (!user) return;

        const { data, error } = await supabase
        .from('chat_history')
        .select('slide_id, course_id, messages')
        .eq('user_id', user.id);

        if (error) throw error;
        if (!data || data.length === 0) {
            console.log('ℹ️ No quiz data in DB for this user');
            return;
        }

        const groupedByCourse: Record<string, Record<string, any[]>> = {};

        for (const row of data) {
          const { course_id, slide_id, messages } = row;
    
          if (!groupedByCourse[course_id]) {
            groupedByCourse[course_id] = {};
          }
    
          groupedByCourse[course_id][slide_id] = messages;
        }


        const multiSetData: [string, string][] = Object.entries(groupedByCourse).map(
            ([course_id, slides]) => [
              `course-chat-${course_id}`,
              JSON.stringify(slides),
            ]
          );
          await AsyncStorage.multiSet(multiSetData);
      
          console.log(`✅ Synced ${multiSetData.length} course chat(s) from DB → local`);

    }catch(err) {
        console.error('❌ Failed to sync chat message data from DB:', err);
    }
  }
}));
