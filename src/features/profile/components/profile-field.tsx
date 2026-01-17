import React from 'react';
import { Input, View } from '@/shared/ui';
import { Text, TextInputProps } from 'react-native';
import type { InputProps } from '@/shared/ui';

interface ProfileFieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  editMode: boolean;
  onValueChange?: (value: string) => void;
  inputProps?: Partial<TextInputProps> & Partial<InputProps>;
  readOnly?: boolean;
}

export default function ProfileField({
  label,
  value,
  placeholder,
  editMode,
  onValueChange,
  inputProps,
  readOnly = false,
}: ProfileFieldProps) {
  const isEditable = editMode && !readOnly;
  const isDisabled = !isEditable;
  const hasValue = Boolean(value && value.trim().length > 0);

  return (
    <View className="mb-5">
      <Text className="mb-2 ml-4 text-sm font-primary text-black">{label}</Text>

      <Input
        value={value}
        onChangeText={isEditable && onValueChange ? onValueChange : undefined}
        disabled={isDisabled}
        placeholder={isEditable ? placeholder : undefined}
        containerStyle={[
          isDisabled && { backgroundColor: '#FFFFFF', borderColor: '#404040' },
        ]}
        inputStyle={isDisabled ? { color: '#404040' } : undefined}
        renderCustomPlaceholder={
          isDisabled && !hasValue
            ? () => (
                <Text className="text-sm text-gray-400/80">Не вказано</Text>
              )
            : undefined
        }
        {...inputProps}
      />
    </View>
  );
}
