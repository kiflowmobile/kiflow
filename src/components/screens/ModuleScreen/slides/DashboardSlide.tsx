import { shadow } from '@/src/components/ui/styles/shadow';
import { useAuthStore, useModulesStore } from '@/src/stores';
import { useMainRatingStore } from '@/src/stores/mainRatingStore';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View, ScrollView} from 'react-native';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

interface DashboardSlideProps {
  title: string;
}

const DashboardSlide: React.FC<DashboardSlideProps> = ({ title }) => {
  const { user } = useAuthStore();
  const currentModuleId = useModulesStore.getState().currentModule?.id;

  const {
    average,
    skills,
    fetchAverage,
    fetchSkills,
    isLoading,
    error,
  } = useMainRatingStore();

  useEffect(() => {
    if (!user || !currentModuleId) return;

    fetchAverage(user.id, currentModuleId);
    fetchSkills(user.id, currentModuleId);
  }, [user, currentModuleId]);


  return (
    <View style={styles.screen}>
      <View style={styles.card}>
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>

        <View style={styles.iconWrapper}>
          <MaterialIcons name="insert-chart" size={40} color="#7c3aed" />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          Ця сторінка відображає твою персональну статистику
        </Text>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Статистика</Text>
          <View style={styles.statsRow}>


            {average !== null && (
              <View style={[styles.statBox, { backgroundColor: '#dcfce7' }]}>
                <Text style={styles.statLabel}>Середній бал</Text>
                <Text style={[styles.statValue, { color: '#15803d' }]}>
                  {average.toFixed(1)} /5
                </Text>
              </View>
            )}

            {/* <View style={[styles.statBox, { backgroundColor: '#ede9fe' }]}>
              <Text style={styles.statLabel}>Курси</Text>
              <Text style={[styles.statValue, { color: '#7c3aed' }]}>5</Text>
            </View> */}
          </View>
        </View>

        {average !== null?

        (<View style={styles.skillsCard}>
          <Text style={styles.statsTitle}>Порівняння навичок</Text>
          {Platform.OS === 'web' ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={skills}>
                <PolarGrid />
                <PolarAngleAxis dataKey="criterion_name" />
                <PolarRadiusAxis angle={30} domain={[0, 5]} />
                <Radar
                  name="Оцінка"
                  dataKey="average_score"
                  stroke="#7c3aed"
                  fill="#7c3aed"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <Text style={styles.chartPlaceholderText}>
              📊 Графік доступний лише у веб-версії
            </Text>
          )}
        </View>)
        : (
          <Text style={styles.noScoresText}>😔 Ви ще не маєте оцінок</Text>
        )

}
        </ScrollView>
      </View>
    </View>
  );
};


export default DashboardSlide;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  card: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#ffffff',
    ...shadow,
  },
  iconWrapper: {
    alignSelf: 'center',
    backgroundColor: '#f3e8ff',
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#475569',
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  skillsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  chartPlaceholder: {
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartPlaceholderText: {
    color: '#64748b',
    textAlign: 'center',
  },
  noScoresText: {
    fontSize: 16,
    color: '#9ca3af', // сірий відтінок
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

