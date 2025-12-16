import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Button from '@/src/components/ui/button';
import { useRouter } from 'expo-router';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';
import { Colors } from '@/src/constants/Colors';

interface FinalSlideProps {
  courseId?: string;
}

export default function FinalSlide({ courseId }: FinalSlideProps) {
  const router = useRouter();

  const onPressReview = () => {
    if (courseId) {
      router.push({ pathname: '/statistics/[id]', params: { id: courseId } });
    } else {
      router.push('/statistics');
    }
  };

  const onClose = () => {
    // go back to previous screen / close module
    try {
      router.back();
    } catch {
      // fallback: go to root
      router.push('/');
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.close} onPress={onClose} accessibilityLabel="Close">
        <Text style={styles.closeText}>✕</Text>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.check}>✓</Text>
        </View>

        <Text style={styles.title}>Congratulations! <br /> You’ve completed the course!</Text>

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
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
  },
  close: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 22,
    color: '#111',
  },
  badge: {
    width: 140,
    height: 140,
    borderRadius: 72,
    backgroundColor: '#53A800',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    // slight shadow for iOS
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  check: {
    color: '#fff',
    fontSize: 56,
    lineHeight: 56,
    fontWeight: '700',
  },
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
  footer: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 0,
  },
});
