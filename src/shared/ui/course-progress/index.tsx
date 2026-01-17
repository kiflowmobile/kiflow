import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ProgressBar from '../progress-bar';

interface CourseProgressSectionProps {
  progress: number;
}

const CourseProgressSection: React.FC<CourseProgressSectionProps> = ({ progress }) => {
  if (progress <= 0) return null;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>Прогрес:</Text>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>
      <ProgressBar percent={progress} height={6} />
    </View>
  );
};

export default CourseProgressSection;

const styles = StyleSheet.create({
  progressContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
});
