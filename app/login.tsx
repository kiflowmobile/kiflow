import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, loading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    const result = await signIn(email, password);

    if (!result.success) {
      const errorMessage = result.error || "Something went wrong. Please try again";
      if (errorMessage.includes("Email not confirmed")) {
        setError("Please confirm your email");
        router.push("/email-verification");
      } else if (errorMessage.includes("Invalid login credentials")) {
        setError("Invalid email or password");
      } else {
        setError(errorMessage);
      }
      return;
    }

    // Check if user has company, if not redirect to company code
    const { hasEnrollments } = useAuthStore.getState();
    if (!hasEnrollments) {
      router.replace("/company-code");
    } else {
      router.replace("/(tabs)/courses");
    }
  };

  const isFormValid = email && password && validateEmail(email);

  return (
    <View className="flex-1 bg-bg p-4 relative">
      <View className="flex-1 w-full max-w-[320px] mx-auto justify-center">
        <Text className="text-title-0 text-center mb-8">Log in</Text>

        <View className="gap-3">
          {error ? (
            <View className="bg-[#FFEBEE] p-3 rounded-lg">
              <Text className="text-body-2 text-[#C10007]">{error}</Text>
            </View>
          ) : null}

          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            showPasswordToggle
            autoCapitalize="none"
            autoComplete="password"
          />
        </View>

        <Button
          size="big"
          disabled={!isFormValid || loading}
          loading={loading}
          className="mt-6 mb-4"
          onPress={handleLogin}
        >
          Login
        </Button>

        <TouchableOpacity onPress={() => router.push("/forgot-password")} className="self-center">
          <Text className="text-title-3 text-primary">Forgot password?</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-title-3 absolute bottom-4 left-4 right-4 text-center">
        Don&apos;t have an account?&nbsp;
        <TouchableOpacity onPress={() => router.push("/register")}>
          <Text className="text-primary">Sign up</Text>
        </TouchableOpacity>
      </Text>
    </View>
  );
}
