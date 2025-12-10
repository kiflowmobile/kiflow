import type { Course } from '@/src/constants/types/course';
import { useCourseProgress } from '@/src/hooks/useCourseProgress';
import { navigateToCourse } from '@/src/utils/courseNavigation';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../../ui/button';
import ProgressBar from '../../../ui/progress-bar';
import { shadow } from '../../../ui/styles/shadow';
import { useAuthStore, useUserProgressStore } from '@/src/stores';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import { Colors } from '@/src/constants/Colors';
import { TEXT_VARIANTS } from '@/src/constants/Fonts';
import ArrowRight from '@/src/assets/images/arrow-right.svg';
import { clearUserLocalData } from '@/src/utils/asyncStorege';
import { quizService } from '@/src/services/quizService';
import { deleteUserCourseSummary } from '@/src/services/course_summaries';
import { chatService } from '@/src/services/chat_history';
import { deleteUsersCourseReting } from '@/src/services/main_rating';

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


  const totalLessons = useMemo(() => {
    if (course.modules && course.modules.length > 0) {
      return course.modules.length;
    }
    if (modules && modules.length > 0) {
      return modules.length;
    }
    return 0;
  }, [course.modules, modules]);

  const isCompleted = courseProgress === 100;
  const isInProgress = courseProgress > 0 && courseProgress < 100;
  const isNotStarted = courseProgress === 0;



  useEffect(() => {
    if (user) {
      fetchUserProgress(user.id);
    }
  }, [user, fetchUserProgress]);

  const handleStartCourse = () => {
    if (!courseProgress || courseProgress === 0) {
      analyticsStore.trackEvent('course__start', { id: course.id });
    }
  
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
  if (!user || !course) return;
  try {
    await clearUserLocalData({ keepProgress: true })
    await quizService.deleteByCourse(user.id, course.id)
    await resetCourseProgress(course.id)
    await deleteUserCourseSummary(user.id, course.id)
    console.log(user.id, course.id)
    await chatService.deleteChatHistory(user.id, course.id)
    await deleteUsersCourseReting(user.id, course.id)

  } catch (err) {
    console.error('Error resetting course progress:', err);
  }
};



return (
  <TouchableOpacity style={styles.card} onPress={handleStartCourse} activeOpacity={0.7}>
    <View style={styles.imageWrapper}>
      <Image
        source={{ uri: course.image || 'https://picsum.photos/800/600' }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.badgesContainer}>
        {totalLessons > 0 && (
          <View style={styles.lessonBadge}>
            <Text style={styles.badgeText}>{totalLessons} modules</Text>
          </View>
        )}
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text style={styles.badgeText}>Completed</Text>
          </View>
        )}
      </View>

      {/* {isDeveloper && courseProgress > 0 && ( */}
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
      {/* )} */}
    </View>

    <View style={styles.content}>
      {/* Progress bar for in-progress courses */}
      {isInProgress && <ProgressBar percent={courseProgress} height={8} />}

      <Text style={styles.title}>{course.title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {course.description || 'Опис відсутній'}
      </Text>

      <View style={styles.button_block}>
        {isNotStarted && (
          <Button
            title="Start course"
            variant="dark"
            size="md"
            onPress={handleStartCourse}
            style={styles.button}
            icon={< ArrowRight />}
            iconPosition="right"
          />
        )}

        {isInProgress && (
          <Button
            title="Continue"
            variant="dark"
            size="md"
            onPress={handleStartCourse}
            style={styles.button}
            icon={
              <Svg
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Path d="M5 12h14" />
                <Path d="M12 5l7 7-7 7" />
              </Svg>
            }
            iconPosition="right"
          />
        )}

        {isCompleted && (
          <Button
            title="Start again"
            variant="accent"
            size="md"
            onPress={handleStartCourse}
            style={styles.button}
          />
        )}
      </View>
    </View>
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
    height: 200,
  },
  badgesContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    gap: 8,
  },
  lessonBadge: {
    backgroundColor: '#5774CD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  completedBadge: {
    backgroundColor: Colors.green,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeText: {
    color: '#ffffff',
    ...TEXT_VARIANTS.label,
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
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  title: {
    ...TEXT_VARIANTS.title2,
    marginTop: 4,
  },
  description: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  button_block: {
    width: '100%',
    marginTop: 16,
  },
  button: {
    marginTop: 16,
    width: '100%', 
  },
});