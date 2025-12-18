import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Button from '@/src/components/ui/button';
import { useRouter } from 'expo-router';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';
import { Colors } from '@/src/constants/Colors';

import confettiAnim from '@/src/assets/animations/confetti.json';
import doneAnim from '@/src/assets/animations/done-button.json';
import LottiePlayer from '../../ui/LottiePlayer/index.web';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/src/stores';
import { sendCourseCompletionEmailUtil } from '@/src/utils/courseCompletionEmail';

interface FinalSlideProps {
  courseId?: string;
}

export default function FinalSlide({ courseId }: FinalSlideProps) {
  const router = useRouter();

  const [showConfetti, setShowConfetti] = useState(false);
  const [doneKey, setDoneKey] = useState(0); 
  const sentRef = useRef(false);

  const { user } = useAuthStore();

  useEffect(() => {
    setShowConfetti(false);
    setDoneKey((k) => k + 1);
    (async () => {
      try {
        if (!courseId || !user?.id) return;

        const key = `course_completion_email_sent_${user.id}_${courseId}`;
        const already = await AsyncStorage.getItem(key);
        if (already) return;
        if (sentRef.current) return;
        sentRef.current = true;

        await sendCourseCompletionEmailUtil(courseId, user);
        await AsyncStorage.setItem(key, '1');
      } catch (e) {
        console.warn('[FinalSlide] Failed to send course completion email', e);
      }
    })();
  }, [courseId, user]);

  const onPressReview = () => {
    if (courseId) {
      router.push({ pathname: '/statistics/[id]', params: { id: courseId } });
    } else {
      router.push('/statistics');
    }
  };

  const onClose = () => {
    router.replace('/courses');
  };

  return (
    <View style={styles.container}>
      {showConfetti && (
        <View style={styles.confettiLayer} pointerEvents="none">
          <LottiePlayer
            animationData={confettiAnim as unknown as object}
            autoPlay
            loop
            style={styles.confetti}
          />
        </View>
      )}

      <Pressable style={styles.close} onPress={onClose} accessibilityLabel="Close">
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.doneWrap}>
          <LottiePlayer
            key={doneKey}
            animationData={doneAnim as unknown as object}
            autoPlay
            loop={false}
            style={styles.doneAnim}
            onAnimationFinish={() => setShowConfetti(true)} // ✅ вот это нужно
          />
        </View>

        <Text style={styles.title}>Congratulations!{'\n'}You’ve completed the course!</Text>
        <Text style={styles.subtitle}>
          Review your results and explore the skills you’ve built.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button title="Review results" onPress={onPressReview} variant="dark" size="lg" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, backgroundColor: 'transparent' },

  confettiLayer: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  confetti: { width: '100%', height: '100%' },

  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 20, zIndex: 1 },

  close: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 20,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 22, color: '#111' },

  doneWrap: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  doneAnim: { width: 140, height: 140 },

  title: {
    ...TEXT_VARIANTS.title1,
    marginBottom: 16,
    marginTop: 32,
    color: Colors.black,
    textAlign: 'center',
  },
  subtitle: {
    ...TEXT_VARIANTS.body1,
    color: Colors.darkGray,
    textAlign: 'center',
    paddingHorizontal: 12,
  },

  footer: { width: '100%', paddingVertical: 20, zIndex: 1 },
});
