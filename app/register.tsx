import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, loading } = useAuthStore();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName) newErrors.firstName = "Це поле обов'язкове";
    if (!lastName) newErrors.lastName = "Це поле обов'язкове";
    if (!email) {
      newErrors.email = "Це поле обов'язкове";
    } else if (!validateEmail(email)) {
      newErrors.email = "Невірний формат email";
    }
    if (!password) {
      newErrors.password = "Це поле обов'язкове";
    } else if (password.length < 6) {
      newErrors.password = "Пароль має бути мінімум 6 символів";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Це поле обов'язкове";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Паролі не співпадають";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    setGeneralError("");

    if (!validateForm()) return;

    const result = await signUp(email, password, firstName, lastName);

    if (!result.success) {
      const errorMessage = result.error || "Щось пішло не так. Спробуйте ще раз";
      setGeneralError(errorMessage.includes("already registered") ? "Цей email вже використовується" : errorMessage);
      return;
    }

    router.replace("/email-verification");
  };

  const isFormValid =
    firstName &&
    lastName &&
    email &&
    password &&
    confirmPassword &&
    validateEmail(email) &&
    password.length >= 6 &&
    password === confirmPassword;

  return (
    <View className="flex-1 bg-bg p-4 items-center justify-center">
      <View className="max-w-[320px] mx-auto w-full">
        <Text className="text-title-0 text-center mb-8">Create account{"\n"}and start learning</Text>

        {generalError && (
          <View className="bg-[#FFEBEE] p-3 rounded-lg mb-3">
            <Text className="text-body-2 text-[#C10007]">{generalError}</Text>
          </View>
        )}

        <View className="gap-3">
          <Input
            placeholder="First name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            error={errors.firstName}
            state={errors.firstName ? "Error" : "Default"}
          />

          <Input
            placeholder="Last name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            error={errors.lastName}
            state={errors.lastName ? "Error" : "Default"}
          />

          <Input
            placeholder="Your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
            state={errors.email ? "Error" : "Default"}
          />

          <Input
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            showPasswordToggle
            autoCapitalize="none"
            autoComplete="password-new"
            error={errors.password}
            state={errors.password ? "Error" : "Default"}
          />

          <Input
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            showPasswordToggle
            autoCapitalize="none"
            autoComplete="password-new"
            error={errors.confirmPassword}
            state={errors.confirmPassword ? "Error" : "Default"}
          />
        </View>

        <Button
          size="big"
          disabled={!isFormValid || loading}
          loading={loading}
          onPress={handleRegister}
          className="mt-4"
        >
          Create account
        </Button>

        <Text className="text-title-3 text-center mt-4">
          Already have an account?&nbsp;
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text className="text-primary">Sign in</Text>
          </TouchableOpacity>
        </Text>
      </View>
    </View>
  );
}
