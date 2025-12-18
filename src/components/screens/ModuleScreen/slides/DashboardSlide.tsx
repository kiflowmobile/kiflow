import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Image } from 'react-native';
import { useAuthStore } from '@/src/stores';
import { useMainRatingStore } from '@/src/stores/mainRatingStore';
import SkillRow from '@/src/components/screens/Statistics/SkillRow';
import Button from '@/src/components/ui/button';
import { Colors } from '@/src/constants/Colors';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';
import DoneLesson from '@/src/assets/images/done-lesson.svg';

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

  const averageText = average !== null ? average.toFixed(1) : '...';

  return (
    <View style={styles.screen}>
      <View style={styles.headerArea}>
        <Image
          source={require('@/src/assets/images/lessons-bg.png')}
          style={styles.headerImage}
          resizeMode="cover"
        />
        <View style={styles.headerTopOverlay} pointerEvents="none">
          <View>
            <DoneLesson width={40} height={40} />
          </View>
          <Text style={styles.headerTitle}>Lesson completed!</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your results</Text>

          <View style={styles.centerBlock}>
            {/* ✅ Average score bubble like your example */}
            <View style={styles.scoreImageWrapper}>
              <Image
                source={require('@/src/assets/images/score-bubble-shape.png')}
                style={styles.scoreBubbleImage}
                resizeMode="contain"
              />
              <View style={styles.scoreOverlay} pointerEvents="none">
                <Text style={styles.scoreText}>{averageText}</Text>
              </View>
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
      </ScrollView>

      <View style={styles.footer} pointerEvents="box-none">
        <Button
          title="Next lesson"
          onPress={() => onComplete && onComplete()}
          variant="dark"
          size="lg"
          accessibilityLabel="Next lesson"
          style={styles.nextBtn}
        />
      </View>
    </View>
  );
};

export default DashboardSlide;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  headerArea: {
    width: '100%',
    position: 'relative',
    height: 200,
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerTopOverlay: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    ...TEXT_VARIANTS.largeTitle,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 16,
    padding: 16,
  },
  cardTitle: {
    ...TEXT_VARIANTS.title2,
    marginBottom: 12,
    textAlign: 'center',
  },

  centerBlock: {
    alignItems: 'center',
    marginBottom: 12,
  },

  scoreImageWrapper: {
    width: 60,
    height: 60,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  scoreBubbleImage: {
    width: '100%',
    height: '100%',
  },
  scoreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    ...TEXT_VARIANTS.title1,
    color: '#0f172a',
  },

  blobLabel: {
    ...TEXT_VARIANTS.body2,
    color: '#525252',
  },

  skillsBlock: {
    marginTop: 8,
  },
  skillsHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },

  nextBtn: {
    width: '100%',
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    zIndex: 20,
  },
});
