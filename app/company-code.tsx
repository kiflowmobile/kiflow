import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function CompanyCodeScreen() {
  const router = useRouter();
  const { redeemInviteCode, loading, user } = useAuthStore();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [showSkipDialog, setShowSkipDialog] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace("/welcome");
    }
  }, [user, router]);

  const handleConfirm = async () => {
    setError("");

    if (!code.trim()) {
      setError("This field is required");
      return;
    }

    const result = await redeemInviteCode(code.trim());

    if (!result.success) {
      setError(result.error || "Invalid code");
      return;
    }

    router.replace("/(tabs)/courses");
  };

  const handleSkip = () => {
    setShowSkipDialog(true);
  };

  const handleConfirmSkip = () => {
    setShowSkipDialog(false);
    router.replace("/(tabs)/courses");
  };

  const isFormValid = code.trim().length > 0;

  return (
    <View className="flex-1 bg-bg p-4 items-center justify-center">
      <View className="max-w-[320px] mx-auto w-full">
        <Text className="text-title-0 text-center mb-3">Enter the code</Text>

        <Text className="text-body-1 text-[#475569] text-center mb-6">
          Add the company code to get acces to the courses
        </Text>

        {error && (
          <View className="bg-[#FFEBEE] p-3 rounded-lg mb-3">
            <Text className="text-body-2 text-[#C10007]">{error}</Text>
          </View>
        )}

        <Input
          placeholder="Enter the code"
          value={code}
          onChangeText={setCode}
          autoCapitalize="none"
          error={error && !code.trim() ? error : undefined}
          state={error && !code.trim() ? "Error" : "Default"}
          className="mb-6"
        />

        <Button
          size="big"
          disabled={!isFormValid || loading}
          loading={loading}
          onPress={handleConfirm}
          className="mb-3"
        >
          Confirm
        </Button>

        <Button size="big" onPress={handleSkip} className="bg-transparent" textClassName="text-text">
          Skip
        </Button>
      </View>

      <Dialog
        visible={showSkipDialog}
        title="Are you sure you want to skip?"
        message="If you continue without an access code, you will only see public courses"
        primaryButtonText="Enter code"
        secondaryButtonText="Skip"
        onPrimaryPress={() => setShowSkipDialog(false)}
        onSecondaryPress={handleConfirmSkip}
        onDismiss={() => setShowSkipDialog(false)}
      />
    </View>
  );
}
