import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateProfile, loading } = useAuthStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    setFirstName(user.user_metadata?.firstName || "");
    setLastName(user.user_metadata?.lastName || "");
    setEmail(user.email || "");
  }, [user, router]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSave = async () => {
    setError("");

    let isValid = true;

    if (!firstName.trim()) {
      setError("First name is required");
      isValid = false;
    }

    if (!lastName.trim()) {
      setError("Last name is required");
      isValid = false;
    }

    if (!email.trim()) {
      setError("Email is required");
      isValid = false;
    } else if (!validateEmail(email)) {
      setError("Invalid email format");
      isValid = false;
    }

    if (!isValid) return;

    const result = await updateProfile(firstName.trim(), lastName.trim(), email.trim());

    if (!result.success) {
      const errorMessage = result.error || "Something went wrong. Please try again";
      setError(errorMessage);
      return;
    }

    router.replace("/(tabs)/profile");
  };

  const handleChangePassword = () => {
    router.push("/change-password");
  };

  const hasChanges =
    firstName.trim() !== (user?.user_metadata?.firstName || "") ||
    lastName.trim() !== (user?.user_metadata?.lastName || "") ||
    email.trim() !== (user?.email || "");

  const isFormValid = firstName.trim() && lastName.trim() && email.trim() && validateEmail(email) && hasChanges;

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

        <Text className="text-title-3 font-semibold">Edit Profile</Text>

        <View className="w-6" />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="flex-1 gap-6">
        {error && (
          <View className="bg-[#FFEBEE] p-3 rounded-lg">
            <Text className="text-body-2 text-[#C10007]">{error}</Text>
          </View>
        )}

        <View className="gap-6">
          <View className="gap-2">
            <Text className="text-title-3 ml-4">First Name</Text>

            <Input
              placeholder="First Name"
              value={firstName}
              onChangeText={(text) => setFirstName(text)}
              autoCapitalize="words"
            />
          </View>

          <View className="gap-2">
            <Text className="text-title-3 ml-4">Last Name</Text>

            <Input
              placeholder="Last Name"
              value={lastName}
              onChangeText={(text) => setLastName(text)}
              autoCapitalize="words"
            />
          </View>

          <View className="gap-2">
            <Text className="text-title-3 ml-4">Email</Text>

            <Input
              placeholder="Email"
              value={email}
              onChangeText={(text) => setEmail(text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <Button onPress={handleChangePassword} className="bg-[#CCD7F1] self-start px-4" textClassName="text-text">
            Change Password
          </Button>
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
