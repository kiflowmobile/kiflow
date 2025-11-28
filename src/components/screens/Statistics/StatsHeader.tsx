import { Colors } from '@/src/constants/Colors';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { computeCourseAvgNum, formatBubbleScore } from '@/src/utils/scoreUtils';

interface Props {
  isLoading: boolean;
  courseAverage: number | null;
  quizAverage: number | null;
  courseTitle?: string | null;
}

const StatsHeader: React.FC<Props> = ({ isLoading, courseAverage, quizAverage, courseTitle }) => {
  const courseAvgNum = computeCourseAvgNum(courseAverage);
  const bubbleText = formatBubbleScore(isLoading, courseAvgNum, quizAverage);
  return (
    <View style={[styles.headerCard]}>
      {(isLoading || courseTitle) && (
        <Text style={styles.courseTitle}> Курс &quot;{courseTitle}&quot;</Text>
      )}

      <View style={styles.contentRow}>
        <View style={styles.headerLeft}>
          <View style={styles.scoreImageWrapper}>
            <Image
              source={require('@/src/assets/images/score-bubble-shape.png')}
              style={styles.scoreBubbleImage}
            />
            <View style={styles.scoreOverlay} pointerEvents="none">
              <Text style={styles.scoreText}>{bubbleText}</Text>
            </View>
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
  scoreImageWrapper: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreBubbleImage: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
  },
  scoreOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: { color: '#000', ...TEXT_VARIANTS.title1 },
  averageLabel: { marginTop: 8, ...TEXT_VARIANTS.body2, textAlign: 'center' },
  headerDivider: {
    width: 1,
    height: 75,
    backgroundColor: 'rgba(15,23,42,0.06)',
    marginHorizontal: 26,
  },
  headerRight: { flex: 1 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreLabel: { ...TEXT_VARIANTS.body2 },
  scoreValue: { ...TEXT_VARIANTS.title1, fontWeight: '500' },
});
