import React from 'react';
import Input from '@/src/components/ui/input';
import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { Colors } from '@/src/constants/Colors';
import { StyleSheet, TextInputProps } from 'react-native';
import type { InputProps } from '@/src/components/ui/input';

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
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <Input
        value={value}
        onChangeText={isEditable && onValueChange ? onValueChange : undefined}
        disabled={isDisabled}
        placeholder={isEditable ? placeholder : undefined}
        containerStyle={[styles.input, isDisabled && styles.inputDisabled]}
        inputStyle={[isDisabled && styles.inputFieldDisabled]}
        // для режима "просмотра" без значения показываем "Не вказано"
        renderCustomPlaceholder={
          isDisabled && !hasValue
            ? () => (
                <Text style={[styles.inputFieldDisabled, styles.readonlyPlaceholder]}>
                  Не вказано
                </Text>
              )
            : undefined
        }
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    marginTop: 0,
  },
  inputDisabled: {
    backgroundColor: Colors.white,
    borderColor: Colors.darkGray,
  },
  inputFieldDisabled: {
    color: Colors.darkGray,
  },
  readonlyPlaceholder: {
    opacity: 0.8,
  },
});
