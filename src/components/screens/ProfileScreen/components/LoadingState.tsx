import { SafeAreaView } from '@/src/components/ui/safe-area-view';
import { Spinner } from '@/src/components/ui/spinner';
import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { StyleSheet } from 'react-native';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = "Завантаження профілю..." }: LoadingStateProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loadingContainer}>
        <Spinner size="large" />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
