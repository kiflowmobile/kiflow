import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/src/config/supabaseClient';
const getAuthStore = () => require('./authStore').useAuthStore;

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
  syncChatFromLocalStorageToDB: async () => {
    // const { user } = useAuthStore.getState();
    const { user } = getAuthStore().getState();

    if (!user) return;

    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const chatKeys = allKeys.filter((key) => key.startsWith('course-chat-'));
      if (chatKeys.length === 0) {
        return;
      }

      const keyValues = await AsyncStorage.multiGet(chatKeys);
      const rowsToUpsert: {
        user_id: string;
        course_id: string;
        slide_id: string;
        interaction_type: string;
        data: { messages: ChatMessage[] };
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

        for (const [slide_id, messages] of Object.entries(parsed)) {
          rowsToUpsert.push({
            user_id: user.id,
            course_id: courseId,
            slide_id,
            interaction_type: 'ai_chat',
            data: { messages: messages as ChatMessage[] },
          });
        }
      }

      if (rowsToUpsert.length === 0) {
        console.log('ℹ️ No valid chat data found');
        return;
      }

      const { error } = await supabase
        .from('user_slide_interactions')
        .upsert(rowsToUpsert, { onConflict: 'user_id,slide_id,interaction_type' });

      if (error) throw error;

    } catch (err) {
      console.error('❌ Failed to sync chat data from local storage:', err);
    }


  },

  syncChatFromDBToLocalStorage: async () => {
    try{
      const { user } = getAuthStore().getState();
        if (!user) return;

        const { data, error } = await supabase
        .from('user_slide_interactions')
        .select('slide_id, course_id, data')
        .eq('user_id', user.id)
        .eq('interaction_type', 'ai_chat');

        if (error) throw error;
        if (!data || data.length === 0) return;

        const groupedByCourse: Record<string, Record<string, any[]>> = {};
        for (const row of data) {
          const { course_id, slide_id, data: interactionData } = row;

          if (!groupedByCourse[course_id]) {
            groupedByCourse[course_id] = {};
          }

          groupedByCourse[course_id][slide_id] = interactionData?.messages || [];
        }


        const multiSetData: [string, string][] = Object.entries(groupedByCourse).map(
            ([course_id, slides]) => [
              `course-chat-${course_id}`,
              JSON.stringify(slides),
            ]
          );
          await AsyncStorage.multiSet(multiSetData);

    }catch(err) {
        console.error('❌ Failed to sync chat message data from DB:', err);
    }
  }
}));
