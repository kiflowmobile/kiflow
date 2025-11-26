import { Input, InputField } from '@/src/components/ui/input';
import { Text } from '@/src/components/ui/text';
import { View } from '@/src/components/ui/view';
import { Colors } from '@/src/constants/Colors';
import { StyleSheet, TextInputProps } from 'react-native';

interface ProfileFieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  editMode: boolean;
  onValueChange?: (value: string) => void;
  inputProps?: Partial<TextInputProps>;
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
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Input 
        style={[
          styles.input, 
          (readOnly || !editMode) && styles.inputDisabled
        ]} 
        size="lg"
      >
        <InputField
          placeholder={placeholder}
          value={value || (readOnly || !editMode ? 'Не вказано' : '')}
          onChangeText={editMode && !readOnly ? onValueChange : undefined}
          editable={editMode && !readOnly}
          style={(readOnly || !editMode) && styles.inputFieldDisabled}
          {...inputProps}
        />
      </Input>
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
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    marginTop: 0,
  },
  inputDisabled: {
    backgroundColor: Colors.darkGray,
    borderColor: Colors.darkGray,
  },
  inputFieldDisabled: {
    color: Colors.darkGray,
  },
});
