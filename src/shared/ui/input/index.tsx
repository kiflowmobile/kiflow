'use client';

import React, { forwardRef, useEffect, useState } from 'react';
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
import { Colors } from '@/src/constants/Colors';

export type InputProps = TextInputProps & {
  errorMessage?: string;
  isInvalid?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPressRightIcon?: () => void;
  /** доп. стили для контейнера (поверх базовых 327x56) */
  containerStyle?: StyleProp<ViewStyle>;
  /** доп. стили для TextInput */
  inputStyle?: StyleProp<TextStyle>;
  hapticFeedback?: boolean;
  renderCustomPlaceholder?: (state: {
    focused: boolean;
    hasError: boolean;
    disabled?: boolean;
  }) => React.ReactNode;
};

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
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
      renderCustomPlaceholder,
      onChangeText,
      value,
      defaultValue,
      placeholder,
      ...rest
    },
    ref,
  ) => {
    const [focused, setFocused] = useState(false);
    const [hasText, setHasText] = useState(() => Boolean(value ?? defaultValue ?? ''));

    useEffect(() => {
      if (value !== undefined && value !== null) {
        setHasText(String(value).length > 0);
      }
    }, [value]);

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

    const flattenedContainerStyle = StyleSheet.flatten(containerStyle) || {};

    const marginKeys: (keyof ViewStyle)[] = [
      'margin',
      'marginTop',
      'marginRight',
      'marginBottom',
      'marginLeft',
      'marginHorizontal',
      'marginVertical',
      'marginStart',
      'marginEnd',
    ];

    const wrapperMarginStyle: ViewStyle = {};
    const containerWithoutMargins: ViewStyle = {};

    Object.entries(flattenedContainerStyle).forEach(([key, value]) => {
      if (marginKeys.includes(key as keyof ViewStyle)) {
        (wrapperMarginStyle as any)[key] = value;
      } else {
        (containerWithoutMargins as any)[key] = value;
      }
    });

    const containerStyles: StyleProp<ViewStyle> = [
      styles.inputContainer,
      focused && styles.inputContainerFocused,
      isDisabled && styles.inputContainerDisabled,
      hasError && styles.inputContainerError,
      containerWithoutMargins,
    ];

    const fieldStyles: StyleProp<TextStyle> = [styles.inputField, inputStyle];

    const handleChangeText = (text: string) => {
      setHasText(text.length > 0);
      onChangeText?.(text);
    };

    return (
      <View style={wrapperMarginStyle}>
        <View style={containerStyles}>
          {leftIcon ? <View style={styles.iconWrapper}>{leftIcon}</View> : null}

          <View style={styles.fieldWrapper}>
            <TextInput
              ref={ref}
              editable={!isDisabled}
              style={fieldStyles}
              placeholder={renderCustomPlaceholder ? undefined : placeholder}
              value={value}
              defaultValue={defaultValue}
              onChangeText={handleChangeText}
              placeholderTextColor={placeholderTextColor ?? '#a1a1a1'}
              onFocus={handleFocus}
              onBlur={handleBlur}
              {...rest}
            />

            {renderCustomPlaceholder && !hasText ? (
              <View pointerEvents="none" style={styles.customPlaceholder}>
                {renderCustomPlaceholder({ focused, hasError, disabled: isDisabled })}
              </View>
            ) : null}
          </View>

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
    width: '100%',
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  inputContainerFocused: {
    borderColor: Colors.blue,
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
  fieldWrapper: {
    flex: 1,
    position: 'relative',
    height: '100%',
    justifyContent: 'center',
  },
  customPlaceholder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 16,
    color: '#000',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
    fontSize: 12,
    color: Colors.red,
  },
});

Input.displayName = 'Input';
