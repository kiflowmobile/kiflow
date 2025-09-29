import Button from '@/src/components/ui/button';
import { VStack } from '@/src/components/ui/vstack';
import { Colors } from '@/src/constants/Colors';
import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'expo-router';
import { Alert, Platform, StyleSheet } from 'react-native';

export default function SignOutSection() {
  const router = useRouter();
  const { signOut } = useAuthStore();

  const handleSignOut = async () => {
    const performSignOut = async () => {
      try {
        await signOut();
        router.replace('/');
      } catch (error) {
        console.error('Error signing out:', error);
        if (Platform.OS === 'web') {
          alert('Помилка: Не вдалося вийти з облікового запису');
        } else {
          Alert.alert('Помилка', 'Не вдалося вийти з облікового запису');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = confirm('Ви впевнені, що хочете вийти з облікового запису?');
      if (confirmed) {
        await performSignOut();
      }
    } else {
      Alert.alert(
        'Вихід з облікового запису',
        'Ви впевнені, що хочете вийти?',
        [
          {
            text: 'Скасувати',
            style: 'cancel',
          },
          {
            text: 'Вийти',
            style: 'destructive',
            onPress: performSignOut,
          },
        ]
      );
    }
  };

  return (
    <VStack space="md" style={styles.signOutSection}>
      <Button
        title="Вийти з облікового запису"
        variant="secondary"
        onPress={handleSignOut}
        size="md"
      />
    </VStack>
  );
}

const styles = StyleSheet.create({
  signOutSection: {
    backgroundColor: Colors.gray[50],
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.gray[200],
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
});
