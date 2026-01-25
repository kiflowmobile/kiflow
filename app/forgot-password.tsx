import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword, loading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleResetPassword = async () => {
    setError("");
    setEmailError("");
    setSuccess(false);

    if (!email) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Invalid email format");
      return;
    }

    const result = await resetPassword(email);

    if (!result.success) {
      setError(result.error || "Something went wrong. Please try again");
      return;
    }

    setSuccess(true);
  };

  const isFormValid = email && validateEmail(email);

  return (
    <View className="flex-1 bg-bg p-4 items-center justify-center">
      <View className="max-w-[320px] mx-auto w-full">
        <Text className="text-title-0 text-center mb-8">Reset password</Text>

        {success ? (
          <View className="gap-6">
            <View className="bg-[#E8F5E9] p-4 rounded-lg">
              <Text className="text-body-2 text-[#2E7D32] text-center">
                Password reset instructions have been sent to your email.
              </Text>
            </View>
            <Button onPress={() => router.replace("/login")}>
              Back to login
            </Button>
          </View>
        ) : (
          <View className="gap-6">
            {error && (
              <View className="bg-[#FFEBEE] p-3 rounded-lg">
                <Text className="text-body-2 text-[#C10007] text-center">{error}</Text>
              </View>
            )}

            <Input
              placeholder="Your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={emailError}
              state={emailError ? "Error" : "Default"}
            />

            <Button
              disabled={!isFormValid || loading}
              loading={loading}
              onPress={handleResetPassword}
            >
              Send instructions
            </Button>

            <TouchableOpacity onPress={() => router.back()} className="self-center">
              <Text className="text-title-3 text-primary">Back to login</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
