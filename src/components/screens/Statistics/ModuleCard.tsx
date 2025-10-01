// ModuleCard.tsx
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import { useMainRatingStore } from '@/src/stores';

interface Skill {
  criterion_id: string;
  criterion_name: string;
  average_score: number;
}

interface ModuleCardProps {
  title: string;
  id: string;
  userId?: string;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, id, userId }) => {
  const { skills ,fetchSkills } = useMainRatingStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !id) return;

    const loadSkills = async () => {
      setLoading(true);
      try {
        await fetchSkills(userId, id); 
       
      } catch (err) {
        console.error('Failed to load skills:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSkills();
  }, [userId, id, fetchSkills]);



  return (
    <View style={styles.moduleCard}>
      <Text style={styles.moduleTitle}>{title}</Text>

      {Platform.OS === 'web' ? (
        loading ? (
          <Text style={styles.chartPlaceholderText}>Завантаження...</Text>
        ) : skills?.length ? (
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
          <Text style={styles.chartPlaceholderText}>Немає даних для відображення</Text>
        )
      ) : (
        <Text style={styles.chartPlaceholderText}>
          📊 Графік доступний лише у веб-версії
        </Text>
      )}
    </View>
  );
};

export default ModuleCard;

const styles = StyleSheet.create({
  moduleCard: { backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, marginBottom: 16 },
  moduleTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  chartPlaceholderText: { color: '#64748b', textAlign: 'center', marginTop: 16 },
});
