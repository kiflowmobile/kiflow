import { cn } from "@/lib/utils";
import React, { useState } from "react";
import { Text, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle } from "react-native";

export type InputState = "Default" | "Focused" | "Error";

interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  state?: InputState;
  showPasswordToggle?: boolean;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  state = "Default",
  showPasswordToggle = false,
  containerStyle,
  className,
  secureTextEntry,
  value,
  ...props
}: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const currentState = state === "Error" ? "Error" : isFocused ? "Focused" : "Default";

  const stateClasses = {
    Default: "border-transparent",
    Focused: "border-primary",
    Error: "border-[#C10007]",
  };

  const showEyeIcon = showPasswordToggle;

  return (
    <View style={containerStyle} className={cn("w-full", className)}>
      <View
        className={cn(
          "flex-row items-center min-h-[56px] gap-3 p-4 rounded-lg bg-white border",
          stateClasses[currentState]
        )}
      >
        <TextInput
          className="flex-1 text-body-2 outline-none"
          value={value}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#A1A1A1"
          {...props}
        />

        {showEyeIcon && (
          <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
            <Text className="text-xl leading-0">👁</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View className="px-4 pt-1">
          <Text className="text-body-2 text-[#C10007]">{error}</Text>
        </View>
      )}
    </View>
  );
}
