import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useMainRatingStore } from '@/src/stores';
import SkillsChart from '../../ui/SkillsChart';

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
      <SkillsChart skills={skills}  />
    </View>
  );
};

export default ModuleCard;

const styles = StyleSheet.create({
  moduleCard: { backgroundColor: '#f9fafb', borderRadius: 16, padding: 16, marginBottom: 16 },
  moduleTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  chartPlaceholderText: { color: '#64748b', textAlign: 'center', marginTop: 16 },
});
