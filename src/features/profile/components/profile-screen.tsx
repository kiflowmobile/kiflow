import { useAuth } from '@/features/auth';
import { useAnalytics } from '@/features/analytics';
import type { User, UserUpdateData } from '../types';
import { profileApi } from '../api/profileApi';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Switch, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AvatarSection } from './avatar-section';
import { LoadingState } from './loading-state';
import { CompanyCode } from './company-code';

export function ProfileScreen() {
  const router = useRouter();
  const { user: authUser, isGuest, signOut } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [isDeveloper, setIsDeveloper] = useState(false);
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [avatarTapCount, setAvatarTapCount] = useState(0);

  const analytics = useAnalytics();

  const [formData, setFormData] = useState<UserUpdateData>({
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
      const { data, error } = await profileApi.getCurrentUserProfile();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setUser(data);
        setFormData({
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
    analytics.trackEvent('profile_screen__save__click');

    try {
      setUpdating(true);

      const updateData = {
        avatar_url: formData.avatar_url,
        first_name: formData.first_name,
        last_name: formData.last_name,
      };

      const { data, error } = await profileApi.updateCurrentUserProfile(updateData);

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
    analytics.trackEvent('profile_screen__cancel__click');

    if (user) {
      setFormData((prev) => ({
        ...prev,
        avatar_url: user.avatar_url || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      }));
    }
    setEditMode(false);
  };

  const handleEdit = () => {
    analytics.trackEvent('profile_screen__edit__click');
    router.push('/profile/edit');
  };

  const handleCourseCodePress = () => {
    analytics.trackEvent('profile_screen__change_company__click');
    router.push('/course-code');
  };

  const handleSignOut = async () => {
    analytics.trackEvent('profile_screen__sign_out__click');

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

      analytics.trackEvent('profile_screen__developer_mode_unlocked');

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
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-4 gap-4">
          <AvatarSection
            fullName={`${formData.first_name || user?.first_name || ''} ${formData.last_name || user?.last_name || ''}`.trim()}
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
            <View className="flex-row items-center justify-between mt-4">
              <Text className="text-base text-black font-primary">Developer Mode</Text>
              <Switch
                value={isDeveloper}
                onValueChange={toggleDeveloperMode}
                trackColor={{ false: '#ededed', true: '#d7f5ff' }}
                ios_backgroundColor="#ededed"
                thumbColor={isDeveloper ? '#ffffff' : '#9e9e9e'}
                style={{ transform: [{ scaleX: 0.94 }, { scaleY: 0.94 }], marginLeft: 8 }}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
