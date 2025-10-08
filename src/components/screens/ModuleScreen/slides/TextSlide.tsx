import BookIcon from '@/src/components/ui/BookIcon';
import { shadow } from '@/src/components/ui/styles/shadow';
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
        <Text style={styles.icon}>
          <BookIcon size={40} color="#000000" />
        </Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.content}>{data.content}</Text>
      </View>
    </View>
  );
};

export default TextSlide;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff', paddingInline: 16, justifyContent: 'center' },
  card: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 760,
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    ...shadow,
  },
  icon: { fontSize: 44, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#111', textAlign: 'center', marginBottom: 8 },
  content: { fontSize: 16, color: '#444', textAlign: 'center', lineHeight: 22 },
});
