import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';
import { Skill } from '@/src/constants/types/skill';

interface Props {
  skill: Skill;
}

const SEGMENT_WIDTH = 25;
const SEGMENT_HEIGHT = 8;

const SkillRow: React.FC<Props> = ({ skill }) => {
  const score = Math.max(0, Math.min(5, skill.average_score));

  return (
    <View style={styles.skillRow}>
      <Text style={styles.skillName} numberOfLines={2} ellipsizeMode="tail">
        {skill.criterion_name}
      </Text>

      <View style={styles.progressAndScore}>
        <Text style={styles.skillScore}>{`${score}/5`}</Text>

        <View style={styles.segmentsRow}>
          {Array.from({ length: 5 }).map((_, i) => {
            const isFirst = i === 0;
            const isLast = i === 4;

            const rawFill = score - i;
            const fill = Math.max(0, Math.min(1, rawFill));

            return (
              <View
                key={i}
                style={[
                  styles.segment,
                  isFirst && styles.segmentFirst,
                  isLast && styles.segmentLast,
                ]}
              >
                {fill > 0 && (
                  <View
                    style={[
                      styles.segmentFill,
                      isFirst && styles.segmentFillFirst,
                      isLast && fill === 1 && styles.segmentFillLast,
                      { width: SEGMENT_WIDTH * fill },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default SkillRow;

const styles = StyleSheet.create({
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  skillName: {
    flex: 1,
    color: '#0f172a',
    marginRight: 12,
    ...TEXT_VARIANTS.body2,
  },
  progressAndScore: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  segmentsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 200,
  },

  segment: {
    width: SEGMENT_WIDTH,
    height: SEGMENT_HEIGHT,
    marginRight: 8,
    backgroundColor: '#EBE9E9',
    borderRadius: 0,
    overflow: 'hidden', 
  },
  segmentFirst: {
    borderTopLeftRadius: SEGMENT_HEIGHT / 2,
    borderBottomLeftRadius: SEGMENT_HEIGHT / 2,
  },
  segmentLast: {
    borderTopRightRadius: SEGMENT_HEIGHT / 2,
    borderBottomRightRadius: SEGMENT_HEIGHT / 2,
    marginRight: 0,
  },

  segmentFill: {
    height: '100%',
    backgroundColor: '#5774CD',
  },
  segmentFillFirst: {
    borderTopLeftRadius: SEGMENT_HEIGHT / 2,
    borderBottomLeftRadius: SEGMENT_HEIGHT / 2,
  },
  segmentFillLast: {
    borderTopRightRadius: SEGMENT_HEIGHT / 2,
    borderBottomRightRadius: SEGMENT_HEIGHT / 2,
  },

  skillScore: {
    width: 56,
    textAlign: 'right',
    ...TEXT_VARIANTS.title3,
    marginBottom: 8,
  },
});
