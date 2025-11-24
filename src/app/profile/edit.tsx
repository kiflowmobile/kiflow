import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import CustomHeader from '@/src/components/ui/CustomHeader';
import ProfileField from '@/src/components/screens/ProfileScreen/components/ProfileField';
import Button from '@/src/components/ui/button';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';
import { updateCurrentUserProfile, getCurrentUserProfile } from '@/src/services/users';
import { VStack } from '@/src/components/ui/vstack';
import { Colors } from '@/src/constants/Colors';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user: supabaseUser } = useAuthStore();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: supabaseUser?.email || '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await getCurrentUserProfile();
      if (data) {
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || supabaseUser?.email || '',
        });
      }
    };
    load();
  }, [supabaseUser]);

  const handleChange = (field: 'first_name' | 'last_name', value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const full_name = `${formData.first_name ?? ''} ${formData.last_name ?? ''}`.trim();
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        full_name,
      };

      const { error } = await updateCurrentUserProfile(updateData);
      if (error) {
        console.error('Error updating profile:', error);
        const msg =
          typeof error === 'string' ? error : error?.message ?? 'Не вдалося оновити профіль';
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
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Edit profile" showBackButton />

      <ScrollView contentContainerStyle={styles.content}>
        <VStack space="md">
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

          <View style={{ marginTop: 8 }}>
            <Button
              title="Change password"
              onPress={() => router.push('/profile/change-password')}
              size="lg"
            />
          </View>
        </VStack>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={saving ? 'Saving...' : 'Save changes'}
          onPress={handleSave}
          disabled={saving}
          variant="accent"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  footer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
  },
});
