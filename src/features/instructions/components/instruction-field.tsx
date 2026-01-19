import React from 'react';
import { Text } from 'react-native';
import { Textarea, TextareaInput, VStack } from '@/shared/ui';

interface InstructionFieldProps {
  title: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  editable?: boolean;
}

export const InstructionField = ({
  title,
  value,
  onChangeText,
  placeholder,
  editable,
}: InstructionFieldProps) => {
  return (
    <VStack space="xs">
      <Text className="w-full text-left font-bold text-typography-900">{title}</Text>
      <Textarea className="border-2 border-primary-600">
        <TextareaInput
          placeholder={placeholder}
          placeholderTextColor="typography-600"
          className="px-2 text-base text-typography-0"
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="sentences"
          multiline
          disabled={!editable}
        />
      </Textarea>
    </VStack>
  );
};
