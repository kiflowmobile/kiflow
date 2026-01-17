import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, ScrollView, View } from 'react-native';
import { CustomHeader, Button } from '@/shared/ui';
import ProfileField from './profile-field';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth';
import { profileApi } from '../api/profileApi';

export function EditProfileScreen() {
  const router = useRouter();
  const { user: supabaseUser } = useAuthStore();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: supabaseUser?.email || '',
  });

  const [initialFormData, setInitialFormData] = useState({
    first_name: '',
    last_name: '',
    email: supabaseUser?.email || '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await profileApi.getCurrentUserProfile();
      if (data) {
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || supabaseUser?.email || '',
        });
        setInitialFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || supabaseUser?.email || '',
        });
      }
    };
    load();
  }, [supabaseUser]);

  const isDirty =
    formData.first_name !== initialFormData.first_name ||
    formData.last_name !== initialFormData.last_name ||
    formData.email !== initialFormData.email;

  const handleChange = (field: 'first_name' | 'last_name', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
      };

      const { error } = await profileApi.updateCurrentUserProfile(updateData);
      if (error) {
        console.error('Error updating profile:', error);
        const msg =
          typeof error === 'string' ? error : (error?.message ?? 'Не вдалося оновити профіль');
        Alert.alert('Помилка', msg);
        return;
      }

      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert('Помилка', 'Не вдалося оновити профіль');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <CustomHeader title="Edit profile" showBackButton />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <View>
          <ProfileField
            label="First name"
            value={formData.first_name}
            placeholder="Enter first name"
            editMode={true}
            onValueChange={(v) => handleChange('first_name', v)}
          />

          <ProfileField
            label="Last name"
            value={formData.last_name}
            placeholder="Enter last name"
            editMode={true}
            onValueChange={(v) => handleChange('last_name', v)}
          />

          <ProfileField label="Email" value={formData.email} editMode={false} readOnly={true} />

          <View className="mt-2">
            <Button
              title="Change password"
              onPress={() => router.push('/profile/change-password')}
              size="md"
              variant="accent"
              style={{ maxWidth: 180 }}
            />
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-5 left-4 right-4">
        <Button
          title={saving ? 'Saving...' : 'Save changes'}
          size="lg"
          onPress={handleSave}
          disabled={saving || !isDirty}
          variant="dark"
        />
      </View>
    </SafeAreaView>
  );
}
