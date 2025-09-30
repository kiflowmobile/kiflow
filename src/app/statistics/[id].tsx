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

interface Module {
  id: string;
  title: string;
}

interface Skill {
  criterion_name: string;
  average_score: number;
}

const CourseModulesScreen: React.FC = () => {
  // Дефолтні дані
  const courseTitle = 'JavaScript для початківців';
  const modules: Module[] = [
    { id: '1', title: 'Вступ' },
    { id: '2', title: 'Основи JS' },
    { id: '3', title: 'Функції та масиви' },
    { id: '4', title: 'Об’єкти та DOM' },
  ];

  const moduleSkills: Record<string, Skill[]> = {
    '1': [
      { criterion_name: 'Знання теми', average_score: 4 },
      { criterion_name: 'Розуміння', average_score: 3.5 },
      { criterion_name: 'Практика', average_score: 4.5 },
    ],
    '2': [
      { criterion_name: 'Знання теми', average_score: 3 },
      { criterion_name: 'Розуміння', average_score: 3 },
      { criterion_name: 'Практика', average_score: 3.5 },
    ],
    '3': [
      { criterion_name: 'Знання теми', average_score: 4.5 },
      { criterion_name: 'Розуміння', average_score: 4 },
      { criterion_name: 'Практика', average_score: 4.5 },
    ],
    '4': [
      { criterion_name: 'Знання теми', average_score: 5 },
      { criterion_name: 'Розуміння', average_score: 4.5 },
      { criterion_name: 'Практика', average_score: 5 },
    ],
  };

  const getCourseAverage = () => {
    const allScores = Object.values(moduleSkills).flat().map(s => s.average_score);
    const total = allScores.reduce((sum, score) => sum + score, 0);
    return (total / allScores.length).toFixed(1);
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
              <Text style={[styles.statValue, { color: '#15803d' }]}>{getCourseAverage()} / 5</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: '#ede9fe' }]}>
              <Text style={styles.statLabel}>Модулі</Text>
              <Text style={[styles.statValue, { color: '#7c3aed' }]}>{modules.length}</Text>
            </View>
          </View>
        </View>

        {modules.map(module => (
          <View key={module.id} style={styles.moduleCard}>
            <Text style={styles.moduleTitle}>{module.title}</Text>

            {Platform.OS === 'web' ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={moduleSkills[module.id]}>
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
              <Text style={styles.chartPlaceholderText}>📊 Графік доступний лише у веб-версії</Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default CourseModulesScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
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
