import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import CustomHeader from '@/src/components/ui/CustomHeader';
import ProfileField from '@/src/components/screens/ProfileScreen/components/ProfileField';
import Button from '@/src/components/ui/button';
import { useAuthStore } from '@/src/stores/authStore';
import { Colors } from '@/src/constants/Colors';
import OpenEye from '@/src/assets/images/eye-open.svg';
import ClosedEye from '@/src/assets/images/eye-closed.svg';
import { useRouter } from 'expo-router';

export default function ChangePasswordScreen() {
  const { changePassword } = useAuthStore();
  const router = useRouter();

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Помилка', 'Нові паролі не співпадають');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Помилка', 'Новий пароль повинен містити принаймні 6 символів');
      return;
    }

    try {
      setIsSubmitting(true);
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      Alert.alert('Успішно', 'Пароль успішно змінено');
      router.back();
    } catch (error: any) {
      Alert.alert('Помилка', error?.message || 'Не вдалося змінити пароль');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader title="Change password" showBackButton />
      <ScrollView contentContainerStyle={styles.content}>
        <ProfileField
          label="Current password"
          value={passwordData.currentPassword}
          placeholder="Current password"
          editMode={true}
          onValueChange={(v) => handleChange('currentPassword', v)}
          inputProps={{
            secureTextEntry: !showCurrent,
            rightIcon: showCurrent ? (
              <OpenEye width={20} height={20} />
            ) : (
              <ClosedEye width={20} height={20} />
            ),
            onPressRightIcon: () => setShowCurrent((s) => !s),
          }}
        />

        <ProfileField
          label="New password"
          value={passwordData.newPassword}
          placeholder="New password"
          editMode={true}
          onValueChange={(v) => handleChange('newPassword', v)}
          inputProps={{
            secureTextEntry: !showNew,
            rightIcon: showNew ? (
              <OpenEye width={20} height={20} />
            ) : (
              <ClosedEye width={20} height={20} />
            ),
            onPressRightIcon: () => setShowNew((s) => !s),
          }}
        />

        <ProfileField
          label="Confirm new password"
          value={passwordData.confirmPassword}
          placeholder="Confirm password"
          editMode={true}
          onValueChange={(v) => handleChange('confirmPassword', v)}
          inputProps={{
            secureTextEntry: !showConfirm,
            rightIcon: showConfirm ? (
              <OpenEye width={20} height={20} />
            ) : (
              <ClosedEye width={20} height={20} />
            ),
            onPressRightIcon: () => setShowConfirm((s) => !s),
          }}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={isSubmitting ? 'Saving...' : 'Save changes'}
          onPress={handleSave}
          disabled={isSubmitting}
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
