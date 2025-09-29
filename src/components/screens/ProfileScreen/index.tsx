import { SafeAreaView } from '@/src/components/ui/safe-area-view';
import { Colors } from '@/src/constants/Colors';
import type { User, UserUpdateData } from '@/src/constants/types/user';
import { getCurrentUserProfile, updateCurrentUserProfile } from '@/src/services/users';
import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';

// Імпорт компонентів
import ActionButtons from './components/ActionButtons';
import AvatarSection from './components/AvatarSection';
import LoadingState from './components/LoadingState';
import PasswordSection from './components/PasswordSection';
import SignOutSection from './components/SignOutSection';
import UserInfoSection from './components/UserInfoSection';

export default function ProfileScreen() {
  const router = useRouter();
  const { user: authUser, isGuest } = useAuthStore();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [formData, setFormData] = useState<UserUpdateData>({
    full_name: '',
    email: '',
    avatar_url: '',
  });


  useEffect(() => {
    if (isGuest || !authUser) {
      router.replace('/auth/login');
      return;
    }
    
    loadUserProfile();
  }, [authUser, isGuest, router]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await getCurrentUserProfile();
      
      if (error) {
        console.error('Error loading profile:', error);
        if (Platform.OS === 'web') {
          alert('Помилка: Не вдалося завантажити профіль');
        } else {
          Alert.alert('Помилка', 'Не вдалося завантажити профіль');
        }
        return;
      }
      
      if (data) {
        setUser(data);
        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          avatar_url: data.avatar_url || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      if (Platform.OS === 'web') {
        alert('Помилка: Сталася помилка при завантаженні профілю');
      } else {
        Alert.alert('Помилка', 'Сталася помилка при завантаженні профілю');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setUpdating(true);
      
      // Відправляємо ім'я та аватар для оновлення
      const updateData = {
        full_name: formData.full_name,
        avatar_url: formData.avatar_url,
      };
      
      const { data, error } = await updateCurrentUserProfile(updateData);
      
      if (error) {
        console.error('Error updating profile:', error);
        if (Platform.OS === 'web') {
          alert('Помилка: Не вдалося оновити профіль');
        } else {
          Alert.alert('Помилка', 'Не вдалося оновити профіль');
        }
        return;
      }
      
      if (data) {
        setUser(data);
        setEditMode(false);
        if (Platform.OS === 'web') {
          alert('Успішно: Профіль оновлено');
        } else {
          Alert.alert('Успішно', 'Профіль оновлено');
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (Platform.OS === 'web') {
        alert('Помилка: Сталася помилка при оновленні профілю');
      } else {
        Alert.alert('Помилка', 'Сталася помилка при оновленні профілю');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.full_name || '',
        avatar_url: user.avatar_url || '',
      }));
    }
    setEditMode(false);
  };

  // Хендлери для дочірніх компонентів
  const handleFormDataChange = (field: keyof UserUpdateData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View  style={styles.content}>
          <AvatarSection
            fullName={formData.full_name || user?.full_name || ''}
          />
          <UserInfoSection
            user={user}
            formData={formData}
            editMode={editMode}
            onFormDataChange={handleFormDataChange}
          />

          <PasswordSection />

          <ActionButtons
            editMode={editMode}
            updating={updating}
            onEdit={handleEdit}
            onSave={handleSave}
            onCancel={handleCancel}
          />

          <SignOutSection />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
    
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  content: {
    padding: 20,
    display: 'flex',
    gap: 32,
  },
});
