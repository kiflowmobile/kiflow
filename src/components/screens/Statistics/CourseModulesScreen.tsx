import React, { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useLocalSearchParams } from 'expo-router';
import { useAuthStore, useMainRatingStore } from '@/src/stores';
import { modulesService } from '@/src/services/modules';
import { useQuizStore } from '@/src/stores/quizStore';
import type { Module } from '@/src/constants/types/modules';

interface Skill {
  criterion_id: string;
  criterion_name: string;
  average_score: number;
}

const CourseModulesScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { fetchSkills } = useMainRatingStore();
  const quizStore = useQuizStore.getState();

  const [modules, setModules] = useState<Module[]>([]);
  const [skillsMap, setSkillsMap] = useState<Record<string, Skill[]>>({});
  const [quizAverage, setQuizAverage] = useState<number | null>(null);
  const [loading, setLoading] = useState({ modules: true, skills: true, quiz: true });

  const courseTitle = 'JavaScript для початківців';

  // 📘 Завантажуємо модулі курсу
  useEffect(() => {
    if (!id) return;
    const loadModules = async () => {
      try {
        const { data } = await modulesService.getModulesByCourse(id);
        setModules(data || []);
      } catch (err) {
        console.error('Error loading modules:', err);
      } finally {
        setLoading((p) => ({ ...p, modules: false }));
      }
    };
    loadModules();
  }, [id]);

  // 📗 Завантажуємо навички по кожному модулю
  useEffect(() => {
    if (!user?.id || !modules.length) return;
    const loadSkills = async () => {
      const map: Record<string, Skill[]> = {};
      for (const mod of modules) {
        try {
          await fetchSkills(user.id, mod.id);
          map[mod.id] = useMainRatingStore.getState().skills;
        } catch {
          map[mod.id] = [];
        }
      }
      setSkillsMap(map);
      setLoading((p) => ({ ...p, skills: false }));
    };
    loadSkills();
  }, [user?.id, modules]);

  // 📙 Завантажуємо середній бал quiz
  useEffect(() => {
    if (!id) return;
    const loadQuiz = async () => {
      try {
        const score = await quizStore.getCourseScore(id);
        setQuizAverage(score);
      } catch (err) {
        console.error('Error loading quiz score:', err);
      } finally {
        setLoading((p) => ({ ...p, quiz: false }));
      }
    };
    loadQuiz();
  }, [id]);

  // 📊 Обчислення середнього балу курсу (AI)
  const courseAverage = useMemo(() => {
    const allSkills = Object.values(skillsMap).flat();
    if (!allSkills.length) return 0;
    const total = allSkills.reduce((sum, s) => sum + s.average_score, 0);
    return parseFloat((total / allSkills.length).toFixed(1));
  }, [skillsMap]);

  // 🧮 Середнє по AI + Quiz
  const combinedAverage = useMemo(() => {
    if (quizAverage == null || !courseAverage) return null;
    return parseFloat(((quizAverage + courseAverage) / 2).toFixed(1));
  }, [quizAverage, courseAverage]);

  const isLoading = loading.modules || loading.skills || loading.quiz;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.card}>
        <View style={styles.iconWrapper}>
          <Svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth={1.5}>
            <Path d="M10 3.2a9 9 0 1 0 10.8 10.8a1 1 0 0 0 -1 -1h-3.8a4.1 4.1 0 1 1 -5 -5v-4a.9 .9 0 0 0 -1 -.8" />
            <Path d="M15 3.5a9 9 0 0 1 5.5 5.5h-4.5a9 9 0 0 0 -1 -1v-4.5" />
          </Svg>
        </View>

        <Text style={styles.title}>{courseTitle}</Text>
        <Text style={styles.subtitle}>Інформація про курс та модулі</Text>

        {/* 📈 Статистика */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Статистика курсу</Text>
          <View style={styles.statsRow}>
            <StatBox label="Оцінка AI" color="#15803d" bg="#dcfce7" value={isLoading ? '...' : `${courseAverage}/5`} />
            <StatBox label="Quiz" color="#2563eb" bg="#dbeafe" value={isLoading ? '...' : `${quizAverage ?? 0}/5`} />
            <StatBox
              label="Середнє"
              color="#7c3aed"
              bg="#f3e8ff"
              value={isLoading || combinedAverage == null ? '...' : `${combinedAverage}/5`}
            />
          </View>
        </View>

        {/* 📚 Модулі */}
        {loading.modules ? (
          <Text style={styles.chartPlaceholderText}>Завантаження модулів...</Text>
        ) : (
          modules.map((module) => (
            <View key={module.id} style={styles.moduleCard}>
              <Text style={styles.moduleTitle}>{module.title}</Text>
              {Platform.OS === 'web' ? (
                loading.skills ? (
                  <Text style={styles.chartPlaceholderText}>Завантаження навичок...</Text>
                ) : skillsMap[module.id]?.length ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={skillsMap[module.id]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="criterion_name" />
                      <PolarRadiusAxis angle={30} domain={[0, 5]} />
                      <Radar name="Оцінка" dataKey="average_score" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <Text style={styles.chartPlaceholderText}>Немає даних</Text>
                )
              ) : (
                <Text style={styles.chartPlaceholderText}>📊 Графік доступний лише у веб-версії</Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

// 🧩 Маленький підкомпонент для статистичних блоків
const StatBox = ({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
}) => (
  <View style={[styles.statBox, { backgroundColor: bg }]}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

export default CourseModulesScreen;

// 🎨 Стилі
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff', padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20 },
  iconWrapper: {
    alignSelf: 'center',
    backgroundColor: '#f3e8ff',
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#475569', marginBottom: 16 },
  statsCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statsTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statBox: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statLabel: { fontSize: 13, color: '#475569', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700' },
  moduleCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  moduleTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  chartPlaceholderText: { color: '#64748b', textAlign: 'center', marginTop: 16 },
});
