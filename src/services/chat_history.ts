import { supabase } from '@/src/config/supabaseClient';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

export const chatService = {
  async fetchChatHistory(userId: string) {
    const { data, error } = await supabase
      .from('chat_history')
      .select('slide_id, course_id, messages')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  async upsertChatHistory(rows: {
    user_id: string;
    course_id: string;
    slide_id: string;
    messages: ChatMessage[];
  }[]) {
    const { error } = await supabase
      .from('chat_history')
      .upsert(rows, { onConflict: 'user_id, slide_id' });

    if (error) throw error;
  },

  async deleteChatHistory(userId: string, courseId: string) {
    const { error } = await supabase
        .from('chat_history')
        .delete()
        .eq('user_id', userId)
        .eq('course_id', courseId);

    if (error) throw error;
  }
};
