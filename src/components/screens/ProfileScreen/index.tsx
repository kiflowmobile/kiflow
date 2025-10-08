import { Colors } from '@/src/constants/Colors';
import type { User, UserUpdateData } from '@/src/constants/types/user';
import { getCurrentUserProfile, updateCurrentUserProfile } from '@/src/services/users';
import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View, Text} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';


// Імпорт компонентів
import AvatarSection from './components/AvatarSection';
import LoadingState from './components/LoadingState';
import PasswordSection from './components/PasswordSection';
import UserInfoSection from './components/UserInfoSection';
import CompanyCode from './components/CompanyCode';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { user: authUser, isGuest, signOut } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);


  const [formData, setFormData] = useState<UserUpdateData>({
    full_name: '',
    email: '',
    avatar_url: '',
    first_name: '',
    last_name: '',
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
        return;
      }

      if (data) {
        setUser(data);
        setFormData({
          full_name: data.full_name || '',
          email: data.email || '',
          avatar_url: data.avatar_url || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
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
        first_name: formData.first_name,
        last_name: formData.last_name,
      };

      const { data, error } = await updateCurrentUserProfile(updateData);

      if (error) {
        console.error('Error updating profile:', error);
        return;
      }

      if (data) {
        setUser(data);
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        full_name: user.full_name || '',
        avatar_url: user.avatar_url || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      }));
    }
    setEditMode(false);
  };

  // Хендлери для дочірніх компонентів
  const handleFormDataChange = (field: keyof UserUpdateData, value: string) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value } as UserUpdateData;
      if (field === 'first_name' || field === 'last_name') {
        const first = field === 'first_name' ? value : prev.first_name || '';
        const last = field === 'last_name' ? value : prev.last_name || '';
        const full = `${first ?? ''} ${last ?? ''}`.trim();
        next.full_name = full;
      }
      return next;
    });
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCourseCodePress = () => {
    router.push('/course-code');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  if (loading) {
    return <LoadingState />;
  }

  const toggleDeveloperMode = async (value: boolean) => {
    try {
      setIsDeveloper(value);
      await AsyncStorage.setItem('isDeveloper', value ? 'true' : 'false');
    } catch (error) {
      console.error('Error saving isDeveloper:', error);
    }
  };
  


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
        
          <AvatarSection
            fullName={formData.full_name || user?.full_name || ''}
            onEditPress={handleEdit}
            onSignOutPress={handleSignOut}
            onSave={handleSave}
            onCancel={handleCancel}
            editMode={editMode}
            updating={updating}
          />
          <View style={{ flexDirection: 'column', alignItems: 'flex-start', marginTop: 16 }}>
            <Text style={{ flex: 1, fontSize: 16 }}>Developer Mode</Text>        
            <Switch
              value={isDeveloper}
              onValueChange={toggleDeveloperMode}
            />
          </View>
          <UserInfoSection
            user={user}
            formData={formData}
            editMode={editMode}
            onFormDataChange={handleFormDataChange}
          />
          <PasswordSection />
          <CompanyCode onPress={handleCourseCodePress} />
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
    display: 'flex',
    paddingInline: 16,
    gap: 16,
  },
});
