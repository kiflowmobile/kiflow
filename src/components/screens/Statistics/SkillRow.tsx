import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Skill } from './CourseModules.types';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';

interface Props {
  skill: Skill;
}

const SkillRow: React.FC<Props> = ({ skill }) => {
  return (
    <View style={styles.skillRow}>
      <Text style={styles.skillName} numberOfLines={2} ellipsizeMode="tail">
        {skill.criterion_name}
      </Text>

      <View style={styles.progressAndScore}>
        <Text style={styles.skillScore}>{`${skill.average_score}/5`}</Text>

        <View style={styles.segmentsRow}>
          {Array.from({ length: 5 }).map((_, i) => {
            const filled = i < Math.round(skill.average_score);
            const isFirst = i === 0;
            const isLast = i === 4;

            return (
              <View
                key={i}
                style={[
                  styles.segment,
                  isFirst && styles.segmentFirst,
                  isLast && styles.segmentLast,
                  filled ? styles.segmentFilled : styles.segmentEmpty,
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default SkillRow;

const SEGMENT_WIDTH = 34;
const SEGMENT_HEIGHT = 14;

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
    borderRadius: 0,
    marginRight: 8,
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

  segmentFilled: {
    backgroundColor: '#5774CD',
  },
  segmentEmpty: {
    backgroundColor: '#EBE9E9',
  },

  skillScore: {
    width: 56,
    textAlign: 'right',
    ...TEXT_VARIANTS.title3,
    marginBottom: 8,
  },
});
