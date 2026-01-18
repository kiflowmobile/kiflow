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
export { AIChat } from './components/ai-chat';
export { AIChatHeader } from './components/ai-chat-header';
export { AIChatMessages } from './components/ai-chat-messages';
export { AIChatInput } from './components/ai-chat-input';
export { MessageBubble } from './components/ai-message-bubble';
export { AudioRecorder } from './components/audio-recorder';
