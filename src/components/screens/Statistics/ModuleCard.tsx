import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import SkillRow from './SkillRow';
import { Colors } from '@/src/constants/Colors';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';
import { Skill } from '@/src/constants/types/skill';
import { Module } from '@/src/constants/types/modules';

interface Props {
  module: Module;
  skills: Skill[];
  loadingSkills: boolean;
  percent: number;
  completedSlides: number;
  totalSlides: number;
}

const ModuleCard: React.FC<Props> = ({
  module,
  skills,
  loadingSkills,
  percent,
  completedSlides,
  totalSlides,
}) => {
  const status = percent >= 100 ? 'Completed' : percent > 0 ? 'In progress' : 'Not started';
  const hasStarted = status !== 'Not started';

  return (
    <View key={module.id} style={[styles.moduleCard]}>
      <View style={styles.moduleHeaderRow}>
        <View>
          <Text style={styles.moduleTitle}>{module.title}</Text>
          <Text style={styles.lessonsText}>{`${completedSlides}/${totalSlides || 0} lessons`}</Text>
        </View>
        <View style={styles.badgeWrapper}>
          <Text
            style={[
              styles.badge,
              status === 'Completed'
                ? styles.badgeGreen
                : status === 'In progress'
                ? styles.badgeOrange
                : styles.badgeGray,
            ]}
          >
            {status}
          </Text>
        </View>
      </View>

      {hasStarted && (
        <>
          <View style={styles.dividerSmall} />

          <Text style={styles.skillsTitle}>Skills level</Text>

          {loadingSkills ? (
            <Text style={styles.chartPlaceholderText}>Завантаження навичок...</Text>
          ) : skills?.length ? (
            skills.map((s) => <SkillRow key={s.criterion_id} skill={s} />)
          ) : (
            <Text style={styles.chartPlaceholderText}>Немає даних</Text>
          )}
        </>
      )}
    </View>
  );
};

export default ModuleCard;

const styles = StyleSheet.create({
  moduleCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  moduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleTitle: { ...TEXT_VARIANTS.title3, marginBottom: 8 },
  lessonsText: { color: '#94a3b8', marginTop: 4 },
  badgeWrapper: { justifyContent: 'center', alignItems: 'flex-end' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  badgeGreen: { backgroundColor: Colors.green },
  badgeOrange: { backgroundColor: Colors.orange },
  badgeGray: { backgroundColor: '#A1A1A1' },
  dividerSmall: {
    height: 1,
    backgroundColor: 'rgba(15,23,42,0.04)',
    marginVertical: 12,
  },
  skillsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  chartPlaceholderText: { color: '#64748b', textAlign: 'center', marginTop: 16 },
});
