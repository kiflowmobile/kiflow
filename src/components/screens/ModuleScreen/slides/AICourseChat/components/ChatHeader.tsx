import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ChatHeaderProps {
  title: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', flexShrink: 1 },
});

export default ChatHeader;
