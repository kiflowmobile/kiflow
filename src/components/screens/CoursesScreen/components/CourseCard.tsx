import { HStack } from '@/src/components/ui/hstack';
import { VStack } from '@/src/components/ui/vstack';
import type { Course } from '@/src/constants/types/course';
import { useCourseProgress } from '@/src/hooks/useCourseProgress';
import { navigateToCourse } from '@/src/utils/courseNavigation';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../../ui/button';
import CourseProgressSection from '../../../ui/course-progress';
import { shadow } from '../../../ui/styles/shadow';
import { useAuthStore, useUserProgressStore } from '@/src/stores';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const { user } = useAuthStore();
  const { fetchUserProgress, resetCourseProgress } = useUserProgressStore();
  const { courseProgress, lastSlideId, modules} = useCourseProgress(course.id);
  const router = useRouter();
  const [isDeveloper, setIsDeveloper] = React.useState(false);
  const analyticsStore = useAnalyticsStore.getState();



  useEffect(() => {
    if (user) {
      fetchUserProgress(user.id);
    }
  }, [user]);

  const handleStartCourse = () => {
    analyticsStore.trackEvent('courses_screen__course__click', {
      id: course.id,
      progress: courseProgress,
    });

    const moduleProgress = modules?.find(module=>module.last_slide_id ===lastSlideId)?.progress
    navigateToCourse(router, course.id, lastSlideId, moduleProgress);
  };

  useEffect(() => {
    const loadDevMode = async () => {
      try {
        const value = await AsyncStorage.getItem('isDeveloper');
        if (value === 'true') setIsDeveloper(true);
      } catch (error) {
        console.error('Error loading developer mode:', error);
      }
    };
    loadDevMode();
  }, []);


const handleResetProgress = async (e?: any) => {
  if (e && e.stopPropagation) {
    e.stopPropagation();
  }
  if (!user) return;
  console.log('reset progress')
  try {
    resetCourseProgress(course.id)

    const storageQuizeKey = `course-progress-${course.id}`;
    await AsyncStorage.removeItem(storageQuizeKey);
    const storageChatKey = `course-chat-${course.id}`;
    await AsyncStorage.removeItem(storageChatKey);
    
  } catch (err) {
    console.error('Error resetting course progress:', err);
  }
};


return (
  <TouchableOpacity 
    style={styles.card} 
    onPress={handleStartCourse}
    activeOpacity={0.7}
  >
    <View style={styles.imageWrapper}>
      <Image
        source={{ uri: course.image || 'https://picsum.photos/800/600' }}
        style={styles.image}
      />
      
      {/* Кнопка скидання прогресу */}
      {isDeveloper && courseProgress > 0 && (
        <TouchableOpacity style={styles.resetButton} onPress={handleResetProgress}>
        <Svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" />
          <Path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
        </Svg>
      </TouchableOpacity>
      )}
    </View>

    <VStack style={styles.content}>
      <Text style={styles.title}>{course.title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {course.description || 'Опис відсутній'}
      </Text>

      <CourseProgressSection progress={courseProgress} />

      <HStack style={styles.button_block}>
        {courseProgress === 0 && (
          <Button
            title="ПОЧАТИ КУРС"
            variant="primary"
            size="md"
            onPress={handleStartCourse}
            style={styles.button}
          />
        )}

        {courseProgress > 0 && courseProgress < 100 && (
          <Button
            title="ПРОДОВЖИТИ"
            variant="primary"
            size="md"
            onPress={handleStartCourse}
            style={styles.button}
          />
        )}

        {courseProgress === 100 && (
          <TouchableOpacity 
            style={styles.completedWrapper}
            onPress={handleStartCourse}
            activeOpacity={0.7}
          >
            <Svg
              width={28}
              height={28}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4cd964"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
              <Path d="M9 12l2 2l4 -4" />
            </Svg>
            <Text style={styles.completedText}>Курс завершено</Text>
          </TouchableOpacity>
        )}


      </HStack>
    </VStack>
  </TouchableOpacity>
);
};

export default CourseCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    ...shadow,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
  },
  resetButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ef4444',
    padding: 6,
    borderRadius: 20,
    opacity: 0.9,
  },
  content: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
  },
  description: {
    fontSize: 13,
    color: '#333',
  },
  button_block: {
    width: '100%',
    display: 'flex',
    alignItems: 'center', 
    justifyContent: 'center',
    marginTop: 12,
  },
  button: {
    marginTop: 16,
    width: '80%',        
  },
  completedWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22c55e',
  },
});
