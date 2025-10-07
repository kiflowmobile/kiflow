import { VStack } from '@/src/components/ui/vstack';
import type { Course } from '@/src/constants/types/course';
import { useCourseProgress } from '@/src/hooks/useCourseProgress';
import { navigateToCourse } from '@/src/utils/courseNavigation';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Button from '../../../ui/button';
import CourseProgressSection from '../../../ui/course-progress';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore, useUserProgressStore } from '@/src/stores';
import { HStack } from '@/src/components/ui/hstack';

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const { user } = useAuthStore();
  const { fetchUserProgress } = useUserProgressStore();
  const { courseProgress, lastSlideId, modules} = useCourseProgress(course.id);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchUserProgress(user.id);
    }
  }, [user]);


  // console.log('lastSlideId', lastSlideId)
  // console.log('modules', )


  const handleStartCourse = () => {

    const moduleProgress = modules?.find(module=>module.last_slide_id ===lastSlideId)?.progress
    // console.log('lastModule', lastModule)

      navigateToCourse(router, course.id, lastSlideId, moduleProgress);

  };

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: course.image || 'https://picsum.photos/800/600' }}
        style={styles.image}
      />
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
            <View style={styles.completedWrapper}>
              <MaterialIcons name="check-circle" size={28} color="#22c55e" />
              <Text style={styles.completedText}>Курс завершено</Text>
            </View>
          )}
        </HStack>
      </VStack>
    </View>
  );
};

export default CourseCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  image: { 
    width: '100%', 
    height: 160 
  },
  content: { 
    padding: 16, 
    gap: 8 
  },
  title: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#111' 
  },
  description: { 
    fontSize: 13, 
    color: '#333' 
  },
  button: {
    marginTop: 16,
    width: '50%',
  },
  button_block: {
    width: '100%', 
    display: "flex", 
    alignItems: 'center', 
    justifyContent: 'center'
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
