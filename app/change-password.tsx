import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { changePassword, loading } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");

    let isValid = true;

    if (!currentPassword) {
      setError("Required");
      isValid = false;
    }

    if (!newPassword) {
      setError("Required");
      isValid = false;
    } else if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      isValid = false;
    } else if (newPassword === currentPassword) {
      setError("New password cannot be the same as current");
      isValid = false;
    }

    if (!confirmPassword) {
      setError("Required");
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      isValid = false;
    }

    if (!isValid) return;

    const result = await changePassword(currentPassword, newPassword);

    if (!result.success) {
      const errorMessage = result.error || "Something went wrong. Please try again";
      setError(errorMessage);
      return;
    }

    router.replace("/edit-profile");
  };

  const isFormValid =
    currentPassword &&
    newPassword &&
    confirmPassword &&
    newPassword.length >= 6 &&
    newPassword === confirmPassword &&
    newPassword !== currentPassword;

  return (
    <View className="flex-1 bg-bg p-4">
      <View className="flex-row items-center justify-between mb-10">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-6 h-6 justify-center items-center"
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <IconSymbol name="xmark" size={24} color="#0A0A0A" />
        </TouchableOpacity>

        <Text className="text-title-3 font-semibold">Change Password</Text>

        <View className="w-6" />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="flex-1 gap-6">
        {error && (
          <View className="bg-[#FFEBEE] p-3 rounded-lg">
            <Text className="text-body-2 text-[#C10007] text-center">{error}</Text>
          </View>
        )}

        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-title-3 ml-4">Current Password</Text>

            <Input
              placeholder="Current Password"
              value={currentPassword}
              onChangeText={(text) => setCurrentPassword(text)}
              secureTextEntry
              showPasswordToggle
              autoCapitalize="none"
              autoComplete="password"
            />
          </View>

          <View className="gap-2">
            <Text className="text-title-3 ml-4">New Password</Text>

            <Input
              placeholder="New Password"
              value={newPassword}
              onChangeText={(text) => setNewPassword(text)}
              secureTextEntry
              showPasswordToggle
              autoCapitalize="none"
              autoComplete="password-new"
            />
          </View>

          <View className="gap-2">
            <Text className="text-title-3 ml-4">Confirm New Password</Text>

            <Input
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={(text) => setConfirmPassword(text)}
              secureTextEntry
              showPasswordToggle
              autoCapitalize="none"
              autoComplete="password-new"
            />
          </View>
        </View>

        <Button
          size="big"
          disabled={!isFormValid || loading}
          loading={loading}
          onPress={handleSave}
          className="mt-auto"
        >
          Save Changes
        </Button>
      </ScrollView>
    </View>
  );
}
