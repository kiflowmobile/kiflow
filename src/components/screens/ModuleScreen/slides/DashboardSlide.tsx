import { useAuthStore } from '@/src/stores';
import { useMainRatingStore } from '@/src/stores/mainRatingStore';
import SkillRow from '@/src/components/screens/Statistics/SkillRow';
import Button from '@/src/components/ui/button';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface DashboardSlideProps {
  title: string;
  courseId: string;
  lessonId: string;
  onComplete?: () => void;
}

const DashboardSlide: React.FC<DashboardSlideProps> = ({
  courseId,
  title,
  lessonId,
  onComplete,
}) => {
  const { user } = useAuthStore();

  const { fetchAverageByLesson, fetchSkillsByLesson } = useMainRatingStore();

  const [average, setAverage] = useState<number | null>(null);
  const [skills, setSkills] = useState<any[]>([]);

  // no quiz data shown here — keep the component focused on lesson ratings

  useEffect(() => {
    if (!user || !lessonId) return;

    const load = async () => {
      try {
        const avg = await fetchAverageByLesson(user.id, lessonId);
        const lessonSkills = await fetchSkillsByLesson(user.id, lessonId);
        setAverage(avg ?? null);
        setSkills(lessonSkills || []);
      } catch (e) {
        console.error('DashboardSlide load error', e);
      }
    };

    load();
  }, [user, lessonId, fetchAverageByLesson, fetchSkillsByLesson]);

  return (
    <View style={styles.screen}>
      <View style={styles.headerArea}>
        <View style={styles.headerTop}>
          <View style={styles.checkCircle}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 13l4 4L19 7"
                stroke="#fff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Text style={styles.headerTitle}>Lesson completed!</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your results</Text>

          <View style={styles.centerBlock}>
            <View style={styles.blob}>
              <Text style={styles.blobValue}>{average !== null ? average.toFixed(1) : '...'}</Text>
            </View>
            <Text style={styles.blobLabel}>Average score</Text>
          </View>

          <View style={styles.skillsBlock}>
            <Text style={styles.skillsHeading}>Skills level</Text>
            {(skills || []).map((s: any) => (
              <SkillRow
                key={s.criterion_id ?? s.criterion_key ?? s.key}
                skill={{
                  criterion_id: s.criterion_id ?? s.criterion_key ?? s.key,
                  criterion_name: s.criterion_name ?? s.name ?? s.key,
                  average_score: s.average_score ?? 0,
                }}
              />
            ))}
          </View>
        </View>

        <Button
          title="Next lesson"
          onPress={() => onComplete && onComplete()}
          variant="dark"
          size="md"
          accessibilityLabel="Next lesson"
        />
      </ScrollView>
    </View>
  );
};

export default DashboardSlide;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  headerArea: {
    backgroundColor: '#32a02b',
    paddingBottom: 18,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  headerTop: {
    alignItems: 'center',
    paddingTop: 22,
    paddingBottom: 8,
  },
  checkCircle: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    ...{
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  centerBlock: {
    alignItems: 'center',
    marginBottom: 12,
  },
  blob: {
    backgroundColor: '#e6ecff',
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  blobValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  blobLabel: {
    color: '#64748b',
    fontSize: 13,
  },
  skillsBlock: {
    marginTop: 8,
  },
  skillsHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skillLeft: {
    flex: 1,
    paddingRight: 8,
  },
  skillName: {
    fontSize: 14,
    color: '#0f172a',
  },
  skillRight: {
    width: 140,
    alignItems: 'flex-end',
  },
  skillScore: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  progressBar: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'flex-end',
  },
  progressSegment: {
    width: 22,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    marginLeft: 6,
  },
  nextBtn: {
    marginTop: 20,
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
