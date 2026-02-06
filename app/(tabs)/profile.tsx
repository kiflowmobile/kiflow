import { LogoutIcon } from '@/components/icons/logout-icon';
import { SCREEN_WIDTH } from '@/components/lesson/styles';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/auth-store';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, hasEnrollments } = useAuthStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  // const [developerMode, setDeveloperMode] = useState(false);

  const handleSignOut = () => {
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutDialog(false);
    await signOut();
    router.replace('/welcome');
  };

  const handleEdit = () => {
    router.push('/edit-profile');
  };

  const handleSwitchToCompany = () => {
    router.push('/company-code');
  };

  const initialLetter = useMemo(() => {
    const firstName = user?.user_metadata?.firstName || '';
    const lastName = user?.user_metadata?.lastName || '';

    if (firstName || lastName) {
      return (firstName[0] || lastName[0]).toUpperCase();
    }

    if (user?.email) {
      return user.email[0].toUpperCase();
    }

    return 'U';
  }, [user]);

  const fullName = useMemo(() => {
    const firstName = user?.user_metadata?.firstName || '';
    const lastName = user?.user_metadata?.lastName || '';

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }

    return user?.email || 'Mystery User';
  }, [user]);

  const registrationDate = useMemo(() => {
    if (!user?.created_at) return null;

    const date = new Date(user.created_at);
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${month} ${day}, ${year}`;
  }, [user]);

  return (
    <ScrollView className="flex-1 bg-bg">
      <View className="flex-1 p-4 items-center relative">
        <TouchableOpacity
          onPress={handleSignOut}
          className="absolute top-8 left-8 p-2 rounded-full bg-white/10 z-10"
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <LogoutIcon width={24} height={24} className="relative left-0.5" />
        </TouchableOpacity>

        <View className="rounded-xl overflow-hidden w-full">
          <Image
            source={require('@/assets/images/profile-bg.jpg')}
            style={{ height: 120, width: SCREEN_WIDTH - 32 }}
          />
        </View>

        <View className="-mt-[50px] mx-auto mb-3 w-[100px] h-[100px] rounded-full bg-white justify-center items-center">
          <Text className="text-[40px] font-title font-semibold">{initialLetter}</Text>
        </View>

        <View className="items-center mb-3 gap-1">
          <Text className="text-title-1 text-center">{fullName}</Text>

          <Text className="text-body-2 text-neutral text-center">{user?.email}</Text>
        </View>

        {registrationDate && (
          <View className="bg-[#FFCCD8] rounded-full py-1.5 px-3 mb-6">
            <Text className="text-body-2 text-text">🎉 Started on {registrationDate}</Text>
          </View>
        )}

        <Button
          onPress={handleEdit}
          className="min-w-[124px] bg-[#CCD7F1] mb-10"
          textClassName="text-text"
        >
          Edit
        </Button>

        {!hasEnrollments && (
          <View className="bg-white border border-[#E5E5E5] rounded-xl p-4 mb-4 w-full">
            <Text className="text-title-2 mb-1">Access</Text>

            <Text className="text-body-2 mb-3">
              You&apos;re viewing public courses only. Switch to company courses tailored for your
              team.
            </Text>

            <TouchableOpacity onPress={handleSwitchToCompany}>
              <Text className="text-title-3 text-primary">Switch to company courses</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* <View className="flex-row items-center gap-2 self-start mb-6">
          <Switch value={developerMode} onValueChange={setDeveloperMode} />

          <Text className="text-body-2 text-text">{translations.profile.developerMode}</Text>
        </View> */}
      </View>

      <Dialog
        visible={showLogoutDialog}
        title="Are you sure you want to logout?"
        message="You will need to sign in again to access your account"
        primaryButtonText="Cancel"
        secondaryButtonText="Logout"
        onPrimaryPress={() => setShowLogoutDialog(false)}
        onSecondaryPress={handleConfirmLogout}
        onDismiss={() => setShowLogoutDialog(false)}
      />
    </ScrollView>
  );
}
