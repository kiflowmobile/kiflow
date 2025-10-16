import React from 'react';
import { View, StyleSheet } from 'react-native';
import MessageBubble from './MessageBubble';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

interface ChatMessagesProps {
  messages: Message[];
  loading: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, loading }) => (
  <View style={styles.chatContent}>
    {messages.map((msg) => (
      <MessageBubble key={msg.id} {...msg} />
    ))}
    {loading && <MessageBubble id="ai-thinking" role="ai" text="AI думає..." />}
  </View>
);

const styles = StyleSheet.create({
  chatContent: { paddingVertical: 8 },
});

export default ChatMessages;
