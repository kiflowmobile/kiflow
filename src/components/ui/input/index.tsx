'use client';

import React, { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  Text,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../../../constants/Colors';

type InputSize = 'sm' | 'md' | 'lg' | 'xl';
type InputVariant = 'outline' | 'underlined' | 'rounded';

export type InputProps = TextInputProps & {
  size?: InputSize;
  variant?: InputVariant;
  errorMessage?: string;
  isInvalid?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPressRightIcon?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  hapticFeedback?: boolean;
};

const Input = forwardRef<TextInput, InputProps>(
  (
    {
      size = 'md',
      variant = 'outline',
      errorMessage,
      isInvalid,
      disabled,
      leftIcon,
      rightIcon,
      onPressRightIcon,
      containerStyle,
      inputStyle,
      hapticFeedback = true,
      placeholderTextColor,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);

    const handleFocus = (e: any) => {
      if (hapticFeedback) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      }
      setFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setFocused(false);
      onBlur?.(e);
    };

    const hasError = isInvalid ?? Boolean(errorMessage);
    const isDisabled = disabled;

    const sizeStyle =
      size === 'xl'
        ? styles.sizeXl
        : size === 'lg'
        ? styles.sizeLg
        : size === 'sm'
        ? styles.sizeSm
        : styles.sizeMd;

    const variantStyle =
      variant === 'underlined'
        ? styles.variantUnderlined
        : variant === 'rounded'
        ? styles.variantRounded
        : styles.variantOutline;

    const containerStyles: StyleProp<ViewStyle> = [
      styles.inputContainer,
      sizeStyle,
      variantStyle,
      focused && styles.inputContainerFocused,
      isDisabled && styles.inputContainerDisabled,
      hasError && styles.inputContainerError,
      containerStyle,
    ];

    const fieldStyles: StyleProp<TextStyle> = [
      styles.inputField,
      variant === 'underlined' && styles.inputFieldUnderlined,
      variant === 'rounded' && styles.inputFieldRounded,
      inputStyle,
    ];

    return (
      <View style={{ width: '100%' }}>
        <View style={containerStyles}>
          {leftIcon ? <View style={styles.iconWrapper}>{leftIcon}</View> : null}

          <TextInput
            ref={ref}
            editable={!isDisabled}
            style={fieldStyles}
            placeholderTextColor={placeholderTextColor ?? Colors.darkGray}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...rest}
          />

          {rightIcon ? (
            onPressRightIcon ? (
              <Pressable style={styles.iconWrapper} onPress={onPressRightIcon} hitSlop={8}>
                {rightIcon}
              </Pressable>
            ) : (
              <View style={styles.iconWrapper}>{rightIcon}</View>
            )
          ) : null}
        </View>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  inputContainer: {
    borderWidth: 1,
    borderColor: Colors.darkGray,
    borderRadius: 16,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  inputContainerFocused: {
    borderColor: Colors.blue,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputContainerDisabled: {
    opacity: 0.4,
  },
  inputContainerError: {
    borderColor: Colors.red,
  },
  inputField: {
    flex: 1,
    color: Colors.black,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputFieldUnderlined: {
    paddingHorizontal: 0,
  },
  inputFieldRounded: {
    paddingHorizontal: 16,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  sizeXl: {
    height: 56,
    minHeight: 56,
  },
  sizeLg: {
    height: 48,
    minHeight: 48,
  },
  sizeMd: {
    height: 44,
    minHeight: 44,
  },
  sizeSm: {
    height: 40,
    minHeight: 40,
  },
  variantUnderlined: {
    borderRadius: 0,
    borderBottomWidth: 1,
    borderWidth: 0,
  },
  variantOutline: {
    borderRadius: 16,
    borderWidth: 1,
  },
  variantRounded: {
    borderRadius: 20,
    borderWidth: 1,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
    fontSize: 12,
    color: Colors.red,
  },
});

Input.displayName = 'Input';

export default Input;
