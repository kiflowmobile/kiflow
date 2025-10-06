import React from 'react';
import { StyleSheet, Text, View } from 'react-native';


interface textData {
  content: string
}

interface TextSlideProps {
  title: string;
  data: textData;
}

const TextSlide: React.FC<TextSlideProps> = ({ title, data }) => {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.icon}>📘</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.content}>{data.content}</Text>
      </View>
    </View>
  );
};

export default TextSlide;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f7fafc', padding: 20, justifyContent: 'center' },
  card: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 760,
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    alignItems: 'center',
  },
  icon: { fontSize: 44, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#111', textAlign: 'center', marginBottom: 8 },
  content: { fontSize: 16, color: '#444', textAlign: 'center', lineHeight: 22 },
});
