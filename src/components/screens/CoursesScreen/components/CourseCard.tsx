import { HStack } from '@/src/components/ui/hstack';
import { VStack } from '@/src/components/ui/vstack';
import type { Course } from '@/src/constants/types/course';
import { useCourseProgress } from '@/src/hooks/useCourseProgress';
import { navigateToCourse } from '@/src/utils/courseNavigation';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Button from '../../../ui/button';
import CourseProgressSection from '../../../ui/course-progress';
import { shadow } from '../../../ui/styles/shadow';

interface CourseCardProps {
  course: Course;
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const router = useRouter();
  const { courseProgress, lastSlideId } = useCourseProgress(course);

  const handleStartCourse = () => {
    navigateToCourse(router, course.id, lastSlideId);
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
          <Button
            title={courseProgress > 0 ? "ПРОДОВЖИТИ" : "ПОЧАТИ КУРС"}
            variant="primary"
            size="md"
            onPress={handleStartCourse}
            style={styles.button}
          />
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
    ...shadow,
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
  }
});
