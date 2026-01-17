import React, { useState } from 'react';
import {
  ImageBackground,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Button, CloseIcon, Image, LogOutIcon, View } from '@/shared/ui';

interface AvatarSectionProps {
  fullName?: string;
  onEditPress: () => void;
  onSignOutPress: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  editMode: boolean;
  updating?: boolean;
  email?: string;
  startedAt?: string | null;
  avatarUrl?: string;
  avatarSource?: any;
  onAvatarSecretTap?: () => void;
}

export default function AvatarSection({
  fullName,
  onEditPress,
  onSignOutPress,
  onSave,
  onCancel,
  editMode,
  updating = false,
  email,
  startedAt,
  avatarUrl,
  avatarSource,
  onAvatarSecretTap,
}: AvatarSectionProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const initial = (fullName || '').trim().charAt(0).toUpperCase() || '?';

  const formatLongDate = (dateString?: string | null) => {
    if (!dateString) return null;
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return null;
    }
  };

  const started = formatLongDate(startedAt || undefined);

  return (
    <View className="items-center mt-2">
      <ImageBackground
        source={require('@/src/assets/images/profile-bg.png')}
        className="relative h-[120px] w-full overflow-hidden rounded-lg bg-primary"
        imageStyle={{ borderRadius: 12, resizeMode: 'cover' }}
      >
        <TouchableOpacity
          className="absolute left-4 top-6 h-10 w-10 items-center justify-center rounded-full bg-white/20"
          onPress={() => setShowConfirm(true)}
        >
          <LogOutIcon size={20} color="#ffffff" />
        </TouchableOpacity>
      </ImageBackground>

      <Pressable className="-mt-[60px] items-center" onPress={onAvatarSecretTap}>
        <View className="h-[110px] w-[110px] items-center justify-center rounded-full border-2 border-background bg-surface">
          {avatarSource ? (
            <Image source={avatarSource} className="h-full w-full rounded-full" />
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} className="h-full w-full rounded-full" />
          ) : (
            <Text className="text-[40px] font-bold text-black">{initial}</Text>
          )}
        </View>
      </Pressable>

      <View className="mt-3 items-center">
        <Text className="text-lg font-semibold text-black">{fullName || ''}</Text>
      </View>

      {email ? <Text className="mt-1.5 text-sm text-gray-400">{email}</Text> : null}

      {started ? (
        <View className="mt-3 rounded-full bg-pink px-4 py-2">
          <Text className="text-sm text-black">🎉 Started on {started}</Text>
        </View>
      ) : null}

      <View className="mt-4 flex-row items-center justify-center">
        {editMode ? (
          <>
            <TouchableOpacity
              onPress={onCancel}
              disabled={updating}
              className="mr-2 items-center justify-center"
            >
              <CloseIcon size={24} color={updating ? '#404040' : '#0A0A0A'} />
            </TouchableOpacity>
            <View className="ml-2">
              <Button
                title={updating ? 'Saving...' : 'Save'}
                onPress={onSave ?? (() => undefined)}
                variant="dark"
                size="sm"
                disabled={updating}
                style={{ minWidth: 120 }}
              />
            </View>
          </>
        ) : (
          <Button
            title="Edit"
            onPress={onEditPress}
            variant="accent"
            size="sm"
            style={{ minWidth: 120 }}
          />
        )}
      </View>

      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}
      >
        <View className="flex-1 justify-end bg-slate-900/50 px-4">
          <Pressable
            className="absolute inset-0"
            onPress={() => setShowConfirm(false)}
          />

          <View className="mb-9 w-full rounded-3xl bg-white px-6 py-6">
            <Text className="mb-3 text-center text-lg font-semibold text-black">
              Are you sure you want to logout?
            </Text>
            <Text className="mb-5 text-center text-sm text-gray-400">
              You’ll need to log in again to continue learning the course.
            </Text>

            <View className="flex-row items-center justify-between">
              <View className="flex-1 px-1.5">
                <Button
                  title="Cancel"
                  variant="accent"
                  size="md"
                  onPress={() => setShowConfirm(false)}
                />
              </View>
              <View className="flex-1 px-1.5">
                <Button
                  title="Log out"
                  variant="dark"
                  size="md"
                  onPress={() => {
                    setShowConfirm(false);
                    onSignOutPress();
                  }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
