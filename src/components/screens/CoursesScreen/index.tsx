import { SafeAreaView } from '@/src/components/ui/safe-area-view';
import { useCourseStore } from '@/src/stores';
import { ScrollView, StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import CourseCard from './components/CourseCard';
import { useEffect } from 'react';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';
import { Colors } from '@/src/constants/Colors';

const CoursesScreen = () => {
  const { courses, isLoading, error, fetchCourses, clearError } = useCourseStore();
  const analyticsStore = useAnalyticsStore.getState();
  const router = useRouter();

  useEffect(() => {
    fetchCourses().catch((err) => {
      console.error('Непередбачена помилка при завантаженні курсів:', err);
    });
  }, [fetchCourses]);


  useEffect(() => {
    analyticsStore.trackEvent('courses_screen__load');
  }, [analyticsStore]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.listContainer}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Помилка: {error}</Text>
            <Text
              style={styles.retryText}
              onPress={() => {
                clearError();
                fetchCourses();
              }}
            >
              Спробувати знову
            </Text>
          </View>
        ) : isLoading ? (
          <Text style={styles.loadingText}>Завантаження курсів...</Text>
        ) : courses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Image
              source={require('@/src/assets/images/welcome-screen.png')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyMainText}>
              Your course list is empty. If you skipped entering your company code, you can try
              again now.
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                analyticsStore.trackEvent?.('courses_screen__enter_code__click');
                router.push('/course-code');
              }}
            >
              <Text style={styles.emptyLinkText}>Enter code</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CoursesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#000' },
  listContainer: { padding: 16 },
  cardsContainer: { gap: 16 },
  loadingText: { textAlign: 'center', color: '#666' },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryText: {
    color: '#007AFF',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyImage: {
    width: 160,
    height: 160,
    marginBottom: 24,
  },
  emptyMainText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginBottom: 12,
    paddingHorizontal: 36,
  },
  emptyLinkText: {
    color: Colors.blue,
    fontSize: 16,
    fontWeight: '600',
  },
});