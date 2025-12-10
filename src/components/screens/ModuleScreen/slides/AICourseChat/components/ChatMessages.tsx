import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MessageBubble from './MessageBubble';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

interface ChatMessagesProps {
  messages: Message[];
  loading: boolean;
  attemptsLeft?: number;
  showAttemptsMessage?: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, loading, attemptsLeft, showAttemptsMessage }) => {
  // Первое AI сообщение (сценарий/вопрос) отображаем как обычный текст
  const firstAIMessage = messages.find(msg => msg.role === 'ai');
  const otherMessages = messages.filter((msg, index) => {
    if (msg.role === 'ai' && index === messages.findIndex(m => m.role === 'ai')) {
      return false; // Пропускаем первое AI сообщение
    }
    return true;
  });

  return (
    <View style={styles.chatContent}>
      {firstAIMessage && (
        <Text style={styles.scenarioText}>{firstAIMessage.text}</Text>
      )}
      {otherMessages.map((msg) => (
        <MessageBubble key={msg.id} {...msg} />
      ))}
      {loading && <MessageBubble id="ai-thinking" role="ai" text="AI думає..." />}
      {showAttemptsMessage && attemptsLeft !== undefined && attemptsLeft > 0 && (
        <View style={styles.attemptsMessage}>
          <Text style={styles.attemptsText}>
            Feel free to refine your answer. You have {attemptsLeft} {attemptsLeft === 1 ? 'attempt' : 'attempts'} left.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chatContent: { 
    paddingVertical: 8,
  },
  scenarioText: {
    ...TEXT_VARIANTS.body1,
    fontSize: 16,
    lineHeight: 24,
    color: '#0f172a',
    marginBottom: 16,
  },
  attemptsMessage: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  attemptsText: {
    ...TEXT_VARIANTS.body2,
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
  },
});

export default ChatMessages;
