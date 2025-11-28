import { Colors } from '@/src/constants/Colors';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  isLoading: boolean;
  courseAverage: number | null;
  quizAverage: number | null;
  courseTitle?: string | null;
}

const StatsHeader: React.FC<Props> = ({ isLoading, courseAverage, quizAverage, courseTitle }) => {
  return (
    <View style={styles.headerCard}>
      {(isLoading || courseTitle) && (
        <Text style={styles.courseTitle}> Курс &quot;{ courseTitle}&quot;</Text>
      )}

      <View style={styles.contentRow}>
        <View style={styles.headerLeft}>
          <View style={styles.averageBlob}>
            <Text style={styles.averageBlobValue}>
              {isLoading || courseAverage === null ? '...' : courseAverage.toFixed(1)}
            </Text>
          </View>
          <Text style={styles.averageLabel}>Average score</Text>
        </View>

        <View style={styles.headerDivider} />

        <View style={styles.headerRight}>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Quiz score</Text>
            <Text style={styles.scoreValue}>
              {isLoading || quizAverage === null ? '...' : quizAverage.toFixed(1)}
            </Text>
          </View>

          <View style={[styles.scoreRow, { marginTop: 8 }]}>
            <Text style={styles.scoreLabel}>Case study score</Text>
            <Text style={styles.scoreValue}>
              {isLoading || courseAverage === null ? '...' : courseAverage.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default StatsHeader;

const styles = StyleSheet.create({
  headerCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
  },
  courseTitle: {
    ...TEXT_VARIANTS.title1,
    marginBottom: 24,
  },
  contentRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  headerLeft: { alignItems: 'center', width: 92 },
  averageBlob: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  averageBlobValue: { color: '#4c1d95', fontSize: 20, fontWeight: '800' },
  averageLabel: { marginTop: 8, ...TEXT_VARIANTS.body2 },
  headerDivider: {
    width: 1,
    height: 68,
    backgroundColor: 'rgba(15,23,42,0.06)',
    marginHorizontal: 12,
  },
  headerRight: { flex: 1 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreLabel: { ...TEXT_VARIANTS.body2 },
  scoreValue: { ...TEXT_VARIANTS.title1, fontWeight: '500'},
});
