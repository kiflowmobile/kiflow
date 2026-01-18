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

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, loading }) => (
  <View className="py-2">
    {messages.map((msg) => (
      <MessageBubble key={msg.id} {...msg} />
    ))}
    {loading && <MessageBubble id="ai-thinking" role="ai" text="AI думає..." />}
  </View>
);

export default ChatMessages;
