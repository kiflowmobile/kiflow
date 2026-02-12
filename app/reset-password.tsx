import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/auth-store';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword, loading, user, setSessionFromUrl } = useAuthStore();
  const global = useGlobalSearchParams();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const hash = window.location.hash || (global['#'] as string);
      if (hash && hash.includes('access_token')) {
        const result = await setSessionFromUrl(hash);
        if (mounted) {
          if (!result.success) setError(result.error || 'Failed to set session');
          setInitializing(false);
        }
      } else {
        if (mounted) {
          setError('No valid reset session found.');
          setInitializing(false);
        }
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    setError('');

    if (!newPassword) {
      setError('New password is required');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const result = await updatePassword(newPassword);

    if (!result.success) {
      setError(result.error || 'Failed to update password');
      return;
    }

    setSuccess(true);
  };

  if (initializing) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator size="large" color="#5774CD" />
      </View>
    );
  }

  if (success) {
    return (
      <View className="flex-1 bg-bg p-4 items-center justify-center">
        <View className="max-w-[320px] mx-auto w-full gap-6 items-center">
          <Text className="text-title-2 text-center text-[#2E7D32]">Password Reset Successful</Text>

          <Button onPress={() => router.replace('/login')} className="w-full">
            Go to Login
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg p-4 items-center justify-center">
      <View className="max-w-[320px] mx-auto w-full gap-6">
        <Text className="text-title-0 text-center">Reset Password</Text>

        {error ? (
          <View className="bg-[#FFEBEE] p-3 rounded-lg">
            <Text className="text-body-2 text-[#C10007] text-center">{error}</Text>
          </View>
        ) : null}

        <View className="gap-4">
          <Input
            placeholder="New Password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            autoCapitalize="none"
          />

          <Input
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
          />

          <Button onPress={handleSave} loading={loading} disabled={loading || (!!error && !user)}>
            Update Password
          </Button>

          <Button
            className="bg-transparent mt-4"
            textClassName="text-[#5774CD]"
            onPress={() => router.replace('/login')}
          >
            Back to Login
          </Button>
        </View>
      </View>
    </View>
  );
}
