import React, { useMemo, useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/shared/ui';
import { Header } from '@/shared/components/header';
import { ProfileField } from './profile-field';
import { useAuth } from '@/features/auth';

import OpenEye from '@/src/assets/images/eye-open.svg';
import ClosedEye from '@/src/assets/images/eye-closed.svg';

const PASSWORD_MIN_LENGTH = 6;

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type VisibilityState = {
  current: boolean;
  new: boolean;
  confirm: boolean;
};

function getValidationError(data: PasswordFormState): string | null {
  if (!data.currentPassword.trim() || !data.newPassword.trim() || !data.confirmPassword.trim()) {
    return 'Усі поля обовʼязкові';
  }

  if (data.newPassword.length < PASSWORD_MIN_LENGTH) {
    return `Новий пароль має містити принаймні ${PASSWORD_MIN_LENGTH} символів`;
  }

  if (data.newPassword !== data.confirmPassword) {
    return 'Нові паролі не співпадають';
  }

  return null;
}

export function ChangePasswordScreen() {
  const { changePassword } = useAuth();
  const router = useRouter();

  const [passwordData, setPasswordData] = useState<PasswordFormState>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [visibility, setVisibility] = useState<VisibilityState>({
    current: false,
    new: false,
    confirm: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormInvalid = useMemo(() => !!getValidationError(passwordData), [passwordData]);

  // keep initial values to detect if user didn't change anything
  const initialPasswordDataRef = useRef<PasswordFormState>(passwordData);

  const isUnchanged = useMemo(() => {
    const init = initialPasswordDataRef.current;
    return (
      passwordData.currentPassword === init.currentPassword &&
      passwordData.newPassword === init.newPassword &&
      passwordData.confirmPassword === init.confirmPassword
    );
  }, [passwordData]);

  const handleChange = (field: keyof PasswordFormState, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleVisibility = (field: keyof VisibilityState) => {
    setVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    const validationError = getValidationError(passwordData);

    // сейчас просто не даём сабмитить, если невалидно
    if (validationError) return;

    try {
      setIsSubmitting(true);
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      router.back();
    } catch (error) {
      console.error('Failed to change password', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Header title="Change password" showBackButton />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <ProfileField
          label="Current password"
          value={passwordData.currentPassword}
          placeholder="Current password"
          editMode
          onValueChange={(v) => handleChange('currentPassword', v)}
          inputProps={{
            secureTextEntry: !visibility.current,
            rightIcon: visibility.current ? (
              <OpenEye width={24} height={24} />
            ) : (
              <ClosedEye width={24} height={24} />
            ),
            onPressRightIcon: () => toggleVisibility('current'),
          }}
        />

        <ProfileField
          label="New password"
          value={passwordData.newPassword}
          placeholder="New password"
          editMode
          onValueChange={(v) => handleChange('newPassword', v)}
          inputProps={{
            secureTextEntry: !visibility.new,
            rightIcon: visibility.new ? (
              <OpenEye width={24} height={24} />
            ) : (
              <ClosedEye width={24} height={24} />
            ),
            onPressRightIcon: () => toggleVisibility('new'),
          }}
        />

        <ProfileField
          label="Confirm new password"
          value={passwordData.confirmPassword}
          placeholder="Confirm password"
          editMode
          onValueChange={(v) => handleChange('confirmPassword', v)}
          inputProps={{
            secureTextEntry: !visibility.confirm,
            rightIcon: visibility.confirm ? (
              <OpenEye width={24} height={24} />
            ) : (
              <ClosedEye width={24} height={24} />
            ),
            onPressRightIcon: () => toggleVisibility('confirm'),
          }}
        />
      </ScrollView>

      <View className="absolute bottom-5 left-4 right-4">
        <Button
          title={isSubmitting ? 'Saving...' : 'Save changes'}
          onPress={handleSave}
          disabled={isSubmitting || isFormInvalid || isUnchanged}
          variant="dark"
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}
