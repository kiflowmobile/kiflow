import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function EmailVerificationScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const checkVerification = async () => {
      if (!user) {
        router.replace("/welcome");
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (data.user?.email_confirmed_at) {
        router.replace("/company-code");
      }
    };

    const interval = setInterval(checkVerification, 3000);
    checkVerification();

    return () => clearInterval(interval);
  }, [user, router]);

  const handleResend = async () => {
    if (!user?.email) return;

    setResending(true);
    setResendSuccess(false);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });

      if (error) {
        console.error("Resend error:", error);
      } else {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      }
    } catch (error) {
      console.error("Resend error:", error);
    } finally {
      setResending(false);
    }
  };

  const handleBackToLogin = async () => {
    await signOut();
    router.replace("/login");
  };

  if (!user) {
    return null;
  }

  return (
    <View className="flex-1 bg-bg p-4 items-center justify-center">
      <View className="max-w-[320px] mx-auto w-full gap-8">
        <View className="gap-3">
          <Text className="text-title-0 text-center">Confirm your email</Text>

          <Text className="text-body-1 text-[#525252] text-center">
            We sent a verification link to your email. Please check your inbox and click the link to confirm.
          </Text>
        </View>

        <View className="gap-6">
          {resendSuccess && (
            <View className="bg-[#E8F5E9] p-3 rounded-lg">
              <Text className="text-body-2 text-[#2E7D32] text-center">Email resent successfully</Text>
            </View>
          )}

          <Button size="big" disabled={resending} onPress={handleResend} loading={resending}>
            Resend email
          </Button>

          <TouchableOpacity onPress={handleBackToLogin} className="self-center">
            <Text className="text-title-3 text-primary">Back to login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
