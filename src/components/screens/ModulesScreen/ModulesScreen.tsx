import ProgressBar from '@/src/components/ui/progress-bar';
import { useModulesStore, useUserProgressStore } from '@/src/stores';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

export default function CourseScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { 
    modules, 
    isLoading, 
    error, 
    fetchModulesByCourse, 
    clearError 
  } = useModulesStore();
  const { getModuleProgress } = useUserProgressStore();
  const { setCurrentModule } = useModulesStore.getState();


  useEffect(() => {
    if (!params.id) return;

    fetchModulesByCourse(params.id).catch(err => {
      console.error('Unexpected error fetching modules:', err);
    });
  }, [params.id, fetchModulesByCourse]);

  const handleModulePress = (module: any) => {
    setCurrentModule(module);
    router.push({
      pathname: '/module/[moduleId]',
      params: { 
        moduleId: module.id,   
        courseId: params.id,
      },
    });
  };


  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Помилка: {error}</Text>
          <Text
            style={styles.retryText}
            onPress={() => {
              clearError();
              if (params.id) {
                fetchModulesByCourse(params.id);
              }
            }}
          >
            Спробувати знову
          </Text>
        </View>
      ) : isLoading ? (
        <Text style={styles.loadingText}>Завантаження модулів...</Text>
      ) : modules.length === 0 ? (
        <Text style={styles.loadingText}>Модулі не знайдено</Text>
      ) : (
        <FlatList
          data={modules}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Pressable style={styles.moduleItem} onPress={() => handleModulePress(item)}>
              <Text style={styles.moduleTitle}>{item.title}</Text>
              {item.description ? (
                <Text style={styles.moduleDescription}>{item.description}</Text>
              ) : null}
              <View>
                {params.id && (
                  <>
                    <Text style={styles.progressText}>
                      {getModuleProgress(params.id, item.id)}%
                    </Text>
                    <View style={styles.progressBarWrapper}>
                      <ProgressBar percent={getModuleProgress(params.id, item.id)} />
                    </View>
                  </>
                )}
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  moduleItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  moduleDescription: {
    fontSize: 14,
    color: '#444',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginBottom: 6,
  },
  
  progressBarWrapper: {
    marginBottom: 6,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 50,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
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