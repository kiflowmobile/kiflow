import { Colors } from '@/src/constants/Colors';
import type { User, UserUpdateData } from '@/src/constants/types/user';
import { getCurrentUserProfile, updateCurrentUserProfile } from '@/src/services/users';
import { useAuthStore } from '@/src/stores/authStore';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AvatarSection from './components/AvatarSection';
import LoadingState from './components/LoadingState';
import CompanyCode from './components/CompanyCode';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnalyticsStore } from '@/src/stores/analyticsStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user: authUser, isGuest, signOut } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [isDeveloper, setIsDeveloper] = useState(false);
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [avatarTapCount, setAvatarTapCount] = useState(0);

  const analyticsStore = useAnalyticsStore.getState();

  const [formData, setFormData] = useState<UserUpdateData>({
    full_name: '',
    email: '',
    avatar_url: '',
    first_name: '',
    last_name: '',
  });

  useEffect(() => {
    if (authUser && !isGuest) loadUserProfile();
  }, [authUser, isGuest]);

  useEffect(() => {
    const loadDevState = async () => {
      try {
        const value = await AsyncStorage.getItem('isDeveloper');
        const unlocked = await AsyncStorage.getItem('devUnlocked');

        const isDev = value === 'true';
        const isUnlocked = unlocked === 'true';

        setIsDeveloper(isDev);
        setDevUnlocked(isUnlocked);
      } catch (error) {
        console.error('Error loading developer mode:', error);
        setIsDeveloper(false);
        setDevUnlocked(false);
      }
    };

    loadDevState();
  }, []);

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
    analyticsStore.trackEvent('profile_screen__save__click');

    try {
      setUpdating(true);

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
    analyticsStore.trackEvent('profile_screen__cancel__click');

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

  const handleEdit = () => {
    analyticsStore.trackEvent('profile_screen__edit__click');
    router.push('/profile/edit');
  };

  const handleCourseCodePress = () => {
    analyticsStore.trackEvent('profile_screen__change_company__click');
    router.push('/course-code');
  };

  const handleSignOut = async () => {
    analyticsStore.trackEvent('profile_screen__sign_out__click');

    try {
      await signOut();
      router.replace('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleDeveloperMode = async (value: boolean) => {
    try {
      setIsDeveloper(value);
      await AsyncStorage.setItem('isDeveloper', value ? 'true' : 'false');
    } catch (error) {
      console.error('Error saving isDeveloper:', error);
    }
  };

  const handleAvatarSecretTap = async () => {
    const nextCount = avatarTapCount + 1;
    setAvatarTapCount(nextCount);

    if (!devUnlocked && nextCount >= 7) {
      setAvatarTapCount(0);
      setDevUnlocked(true);
      setIsDeveloper(true);

      analyticsStore.trackEvent?.('profile_screen__developer_mode_unlocked');

      try {
        await AsyncStorage.multiSet([
          ['devUnlocked', 'true'],
          ['isDeveloper', 'true'],
        ]);
      } catch (error) {
        console.error('Error saving devUnlocked/isDeveloper:', error);
      }
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <AvatarSection
            fullName={formData.full_name || user?.full_name || ''}
            email={user?.email ?? undefined}
            startedAt={user?.created_at ?? null}
            onEditPress={handleEdit}
            onSignOutPress={handleSignOut}
            onSave={handleSave}
            onCancel={handleCancel}
            editMode={editMode}
            updating={updating}
            onAvatarSecretTap={handleAvatarSecretTap}
          />

          <CompanyCode onPress={handleCourseCodePress} />

          {devUnlocked && (
            <View style={styles.devRow}>
              <Text style={styles.devLabel}>Developer Mode</Text>
              <Switch
                value={isDeveloper}
                onValueChange={toggleDeveloperMode}
                trackColor={{ false: '#ededed', true: '#d7f5ff' }}
                ios_backgroundColor="#ededed"
                thumbColor={isDeveloper ? '#ffffff' : '#9e9e9e'}
                style={styles.switch}
              />
            </View>
          )}
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
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  devLabel: {
    fontSize: 16,
    color: Colors.black,
  },
  switch: {
    // slightly smaller switch to better match screenshot
    transform: [{ scaleX: 0.94 }, { scaleY: 0.94 }],
    marginLeft: 8,
  },
});
