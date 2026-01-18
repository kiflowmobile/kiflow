import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, ScrollView, View } from 'react-native';
import { Button } from '@/shared/ui';
import { Header } from '@/shared/components/header';
import { ProfileField } from './profile-field';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth';
import { useProfile } from '../hooks/useProfile';

export function EditProfileScreen() {
  const router = useRouter();
  const { user: supabaseUser } = useAuth();
  const { profile, fetchProfile, updateProfile, error: profileError } = useProfile();

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
      await fetchProfile();
    };
    load();
  }, [supabaseUser, fetchProfile]);

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || supabaseUser?.email || '',
      });
      setInitialFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || supabaseUser?.email || '',
      });
    }
  }, [profile, supabaseUser]);

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

      const result = await updateProfile(updateData);
      if (!result) {
        console.error('Error updating profile:', profileError);
        const msg = profileError || 'Не вдалося оновити профіль';
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
      <Header title="Edit profile" showBackButton />

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
