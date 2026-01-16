// Types for user_slide_interactions table

export type InteractionType = 'quiz' | 'ai_chat';

export interface QuizInteractionData {
  selected_answer: number;
  correct_answer: number;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

export interface AiChatInteractionData {
  messages: AiChatMessage[];
}

export interface UserSlideInteraction {
  id: string;
  user_id: string;
  slide_id: string;
  interaction_type: InteractionType;
  data: QuizInteractionData | AiChatInteractionData;
  created_at: string;
  updated_at?: string;
}

// Type guards
export function isQuizData(data: any): data is QuizInteractionData {
  return typeof data?.selected_answer === 'number' && typeof data?.correct_answer === 'number';
}

export function isAiChatData(data: any): data is AiChatInteractionData {
  return Array.isArray(data?.messages);
}
