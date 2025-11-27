import { SafeAreaView } from '@/src/components/ui/safe-area-view';
import { Text } from '@/src/components/ui/text';
import { useCourseStore } from '@/src/stores';
import { ScrollView, StyleSheet, View } from 'react-native';
import CourseCard from './components/CourseCard';
import { useEffect } from 'react';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';

const CoursesScreen = () => {
  const { courses, isLoading, error, fetchCourses, clearError } = useCourseStore();
  const analyticsStore = useAnalyticsStore.getState();


  useEffect(() => {
    fetchCourses().catch((err) => {
      console.error('Непередбачена помилка при завантаженні курсів:', err);
    });
  }, [fetchCourses]);



  useEffect(() => {
    analyticsStore.trackEvent('courses_screen__load');
  }, []);


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
          <Text style={styles.loadingText}>Курси не знайдено</Text>
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
  container: { flex: 1, backgroundColor: '#fff' },
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
});
