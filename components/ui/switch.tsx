import { cn } from "@/lib/utils";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({ value, onValueChange, disabled = false, className }: SwitchProps) {
  const handlePress = () => {
    if (!disabled) {
      onValueChange(!value);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      className={cn("justify-center items-center", className)}
    >
      <View
        className={cn(
          "w-[52px] h-8 rounded-full border-2 p-0.5 flex-row items-center",
          value ? "bg-[#5EA500] border-[#5EA500] justify-end" : "bg-white border-[#A1A1A1] justify-start",
          disabled && "opacity-50"
        )}
      >
        <View className={cn("w-6 h-6 rounded-full", value ? "bg-white" : "bg-[#A1A1A1]")} />
      </View>
    </TouchableOpacity>
  );
}
