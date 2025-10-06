import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore, useMainRatingStore } from '@/src/stores';
import { Module } from '@/src/constants/types/modules';
import { modulesService } from '@/src/services/modules';

interface Skill {
  criterion_id: string;
  criterion_name: string;
  average_score: number;
}

const CourseModulesScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { fetchSkills } = useMainRatingStore();

  const [courseModules, setCourseModules] = useState<Module[]>([]);
  const [moduleSkillsMap, setModuleSkillsMap] = useState<Record<string, Skill[]>>({});
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingSkills, setLoadingSkills] = useState(true);

  const courseTitle = 'JavaScript для початківців';

  // Завантажуємо модулі конкретного курсу
  useEffect(() => {
    if (!id) return;

    const loadModules = async () => {
      setLoadingModules(true);
      try {
        const { data } = await modulesService.getModulesByCourse(id);
        setCourseModules(data || []);
      } catch (err) {
        console.error('Error loading modules:', err);
        setCourseModules([]);
      } finally {
        setLoadingModules(false);
      }
    };

    loadModules();
  }, [id]);

  // Завантажуємо навички для всіх модулів після завантаження модулів
  useEffect(() => {
    if (!user || !courseModules.length) return;

    const loadSkills = async () => {
      setLoadingSkills(true);
      const skillsMap: Record<string, Skill[]> = {};

      for (const module of courseModules) {
        try {
          await fetchSkills(user.id, module.id);
          skillsMap[module.id] = useMainRatingStore.getState().skills;
        } catch (err) {
          skillsMap[module.id] = [];
          console.error('Error loading skills for module', module.id, err);
        }
      }

      setModuleSkillsMap(skillsMap);
      setLoadingSkills(false);
    };

    loadSkills();
  }, [user, courseModules, fetchSkills]);

  const getCourseAverage = () => {
    const allSkills = Object.values(moduleSkillsMap).flat();
    if (!allSkills.length) return '0';
    const total = allSkills.reduce((sum, s) => sum + s.average_score, 0);
    return (total / allSkills.length).toFixed(1);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.card}>
        <View style={styles.iconWrapper}>
          <MaterialIcons name="insert-chart" size={40} color="#7c3aed" />
        </View>

        <Text style={styles.title}>{courseTitle}</Text>
        <Text style={styles.subtitle}>Інформація про курс та модулі</Text>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Статистика курсу</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: '#dcfce7' }]}>
              <Text style={styles.statLabel}>Середній бал</Text>
              <Text style={[styles.statValue, { color: '#15803d' }]}>
                {loadingSkills ? '...' : getCourseAverage()} / 5
              </Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: '#ede9fe' }]}>
              <Text style={styles.statLabel}>Модулі</Text>
              <Text style={[styles.statValue, { color: '#7c3aed' }]}>
                {loadingModules ? '...' : courseModules.length}
              </Text>
            </View>
          </View>
        </View>

        {loadingModules ? (
          <Text style={styles.chartPlaceholderText}>Завантаження модулів...</Text>
        ) : (
          courseModules.map((module) => (
            <View key={module.id} style={styles.moduleCard}>
              <Text style={styles.moduleTitle}>{module.title}</Text>

              {Platform.OS === 'web' ? (
                loadingSkills ? (
                  <Text style={styles.chartPlaceholderText}>Завантаження навичок...</Text>
                ) : moduleSkillsMap[module.id]?.length ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={moduleSkillsMap[module.id]}>
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
                  <Text style={styles.chartPlaceholderText}>Немає даних</Text>
                )
              ) : (
                <Text style={styles.chartPlaceholderText}>
                  📊 Графік доступний лише у веб-версії
                </Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default CourseModulesScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 24 },
  iconWrapper: {
    alignSelf: 'center',
    backgroundColor: '#f3e8ff',
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#475569', marginBottom: 16 },
  statsCard: { backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, marginBottom: 16 },
  statsTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statBox: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statLabel: { fontSize: 13, color: '#475569', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700' },
  moduleCard: { backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, marginBottom: 16 },
  moduleTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  chartPlaceholderText: { color: '#64748b', textAlign: 'center', marginTop: 16 },
});
