import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MediaPlaceholderProps {
  message?: string;
}

const MediaPlaceholder: React.FC<MediaPlaceholderProps> = ({ message = 'Відео ще недоступне' }) => {
  return (
    <View style={styles.screen}>
      <View style={styles.box}>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

export default MediaPlaceholder;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff', padding: 18, justifyContent: 'center' },
  box: {
    height: 260,
    width: '100%',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  message: { fontSize: 18, color: '#64748b' },
});
