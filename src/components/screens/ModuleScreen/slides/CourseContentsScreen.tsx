// import { secondSlideData } from '@/src/constants/types/slides';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

interface CourseContentsScreenProps {
  title: string;
  // data: secondSlideData[];
  data: any[]
}

export default function CourseContentsScreen({ title, data }: CourseContentsScreenProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();

  const handleModulePress = (module: any) => {
    const moduleOrder = data.findIndex(m => m.id === module.id) + 1; 
  
    router.push(
      `/courses/${params.id}?moduleOrder=${moduleOrder}&slideOrder=1`
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{title}</Text>

      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.moduleItem}
            onPress={() => handleModulePress(item)}
          >
            <Text style={styles.moduleTitle}>{item.title}</Text>
            {item.description ? (
              <Text style={styles.moduleDescription}>{item.description}</Text>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f7fafc',
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    color: '#111',
  },
  moduleItem: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.05)',
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
});
