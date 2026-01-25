import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Button } from "./button";

interface DialogProps {
  visible: boolean;
  title: string;
  message: string;
  primaryButtonText: string;
  secondaryButtonText?: string;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
  onDismiss?: () => void;
}

export function Dialog({
  visible,
  title,
  message,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryPress,
  onSecondaryPress,
  onDismiss,
}: DialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable className="flex-1 bg-black/60 justify-center items-center p-4" onPress={onDismiss}>
        <View
          className="bg-white rounded-xl pt-6 px-4 pb-4 w-full max-w-[358px]"
          onStartShouldSetResponder={() => true}
        >
          <View className="items-center mb-6 gap-2">
            <Text className="text-title-1 text-center">{title}</Text>
            <Text className="text-body-2 text-[#525252] text-center">{message}</Text>
          </View>

          <View className="flex-row gap-4 items-center">
            {secondaryButtonText && (
              <View className="flex-1">
                <Button onPress={onSecondaryPress} className="bg-transparent" textClassName="text-text">
                  {secondaryButtonText}
                </Button>
              </View>
            )}

            <View className="flex-1">
              <Button onPress={onPrimaryPress}>{primaryButtonText}</Button>
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}
