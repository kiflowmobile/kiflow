import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface CourseIntroScreenProps {
  title: string;
  data?: string;
}

const CourseIntroScreen: React.FC<CourseIntroScreenProps> = ({ title, data }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {data && <Text style={styles.description}>{data}</Text>}
    </View>
  );
};

export default CourseIntroScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  description: { fontSize: 16, textAlign: 'center', marginBottom: 24 }
});