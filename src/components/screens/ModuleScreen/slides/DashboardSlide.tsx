import SkillsChart from '@/src/components/ui/SkillsChart';
import { shadow } from '@/src/components/ui/styles/shadow';
import { useAuthStore, useModulesStore } from '@/src/stores';
import { useMainRatingStore } from '@/src/stores/mainRatingStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View, ScrollView} from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface DashboardSlideProps {
  title: string;
  courseId: string
}

const calculateQuizRating = (quizData: Record<string, { selectedAnswer: number; correctAnswer: number }>) => {
  const entries = Object.values(quizData);
  const total = entries.length;
  if (total === 0) return 0;

  const correct = entries.filter(q => q.selectedAnswer === q.correctAnswer).length;
  const rating = (correct / total) * 5;

  return Number(rating.toFixed(1)); 
};

const DashboardSlide: React.FC<DashboardSlideProps> = ({ courseId, title }) => {
  const { user } = useAuthStore();
  const currentModuleId = useModulesStore.getState().currentModule?.id;

  const {
    average,
    skills,
    fetchAverage,
    fetchSkills,
  } = useMainRatingStore();
  const [quizRatings, setQuizRatings] = useState<number | null>(null);

  useEffect(() => {
    const loadQuizRatings = async () => {
      try {
        const stored = await AsyncStorage.getItem(`course-progress-${courseId}`);
        if (!stored) return;
        const parsed = JSON.parse(stored);

        
  
        const quizScore = calculateQuizRating(parsed);
        setQuizRatings(quizScore);
      } catch (err) {
        console.error('Error loading quiz ratings:', err);
      }
    };
  
    if (courseId) loadQuizRatings();
  }, [courseId]);

  useEffect(() => {
    if (!user || !currentModuleId) return;

    fetchAverage(user.id, currentModuleId);
    fetchSkills(user.id, currentModuleId);
  }, [user, currentModuleId]);

  const combinedAverage = useMemo(() => {
    if (quizRatings !== null && average !== null) {
      const avg = (quizRatings + Number(average.toFixed(1))) / 2;
      return `${avg.toFixed(1)}/5`;
    }
    return '...';
  }, [quizRatings, average]);


  return (
    <View style={styles.screen}>
      <View style={styles.card}>
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View style={styles.iconWrapper}>
          <Svg
            width={40}
            height={40}
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7c3aed"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M10 3.2a9 9 0 1 0 10.8 10.8a1 1 0 0 0 -1 -1h-3.8a4.1 4.1 0 1 1 -5 -5v-4a.9 .9 0 0 0 -1 -.8" />
            <Path d="M15 3.5a9 9 0 0 1 5.5 5.5h-4.5a9 9 0 0 0 -1 -1v-4.5" />
          </Svg>
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
            <View style={[styles.statBox, { backgroundColor: '#ede9fe' }]}>
              <Text style={styles.statLabel}>Модулі quiz</Text>
              <Text style={[styles.statValue, { color: '#7c3aed' }]}>
                {quizRatings ? quizRatings + '/5': '...' }
              </Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#dbeafe' }]}>
              <Text style={styles.statLabel}>Середній бал</Text>
              <Text style={[styles.statValue, { color: '#2563eb' }]}>
                {combinedAverage}
              </Text>
            </View>
          </View>
        </View>
        <SkillsChart skills={skills} average={average} />
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

