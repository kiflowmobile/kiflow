import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/src/constants/Colors';

interface MessageBubbleProps {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ role, text, id }) => (
  <View
    key={id}
    style={[styles.messageBubble, role === 'ai' ? styles.aiBubble : styles.userBubble]}
  >
    <Text style={styles.messageText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  aiBubble: {
    backgroundColor: Colors.white,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  userBubble: { backgroundColor: 'rgba(0,0,0,0.03)', alignSelf: 'flex-end' },
  messageIcon: { marginRight: 6 },
  messageText: { fontSize: 16, color: '#0f172a', lineHeight: 22 },
});

export default MessageBubble;
