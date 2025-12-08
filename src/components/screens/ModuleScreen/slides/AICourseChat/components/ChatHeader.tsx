import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';
import { Colors } from '@/src/constants/Colors';

interface ChatHeaderProps {
  title: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title }) => (
  <View style={styles.header}>
    <View style={styles.badge}>
      <Text style={styles.badgeText}>Case study</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFD988',
    alignSelf: 'flex-start',
  },
  badgeText: {
    ...TEXT_VARIANTS.body2,
    fontWeight: '700',
    color: Colors.black,
  },
});

export default ChatHeader;
