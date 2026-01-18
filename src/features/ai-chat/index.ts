// API
export { promptsApi } from './api/promptsApi';
export type { SlidePrompt } from './api/promptsApi';
export { askGemini } from './api/ask-gemini';
export type { GeminiResponse, Message } from './api/ask-gemini';
export { sendAudioToGemini } from './api/send-audio';

// Store
export { usePromptsStore } from './store/promptsStore';

// Utils
export { buildPrompt } from './utils/build-prompt';
export { formatAIResponseForChat } from './utils/format-ai-response';

// Components
export { default as AIChat } from './components/ai-chat';
export { default as ChatHeader } from './components/ai-chat-header';
export { default as ChatMessages } from './components/ai-chat-messages';
export { default as ChatInput } from './components/ai-chat-input';
export { MessageBubble } from './components/ai-message-bubble';
export { default as AudioRecorder } from './components/audio-recorder';
