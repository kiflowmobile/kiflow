import React from 'react';
import { View } from 'react-native';

import { MessageBubble } from './ai-message-bubble';

interface MessageWithId {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

interface ChatMessagesProps {
  messages: MessageWithId[];
  loading: boolean;
}

export const AIChatMessages: React.FC<ChatMessagesProps> = ({ messages, loading }) => (
  <View className="py-2">
    {messages.map((msg) => (
      <MessageBubble key={msg.id} {...msg} />
    ))}
    {loading && <MessageBubble id="ai-thinking" role="ai" text="AI думає..." />}
  </View>
);
