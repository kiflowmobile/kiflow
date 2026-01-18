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
import clsx from 'clsx';

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

    const containerClassName = clsx(
      'w-full h-14 rounded-md bg-surface border flex-row items-center overflow-hidden',
      focused && 'border-primary',
      !focused && !hasError && 'border-gray-300',
      hasError && 'border-error',
      isDisabled && 'opacity-40'
    );

    const containerStyles: StyleProp<ViewStyle> = [containerWithoutMargins];

    const handleChangeText = (text: string) => {
      setHasText(text.length > 0);
      onChangeText?.(text);
    };

    return (
      <View style={wrapperMarginStyle}>
        <View className={containerClassName} style={containerStyles}>
          {leftIcon ? <View className="justify-center items-center px-3">{leftIcon}</View> : null}

          <View className="flex-1 relative h-full justify-center">
            <TextInput
              ref={ref}
              editable={!isDisabled}
              className="flex-1 text-black text-base px-4 py-4"
              style={inputStyle}
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
              <View
                pointerEvents="none"
                className="absolute inset-0 justify-center px-4"
              >
                {renderCustomPlaceholder({ focused, hasError, disabled: isDisabled })}
              </View>
            ) : null}
          </View>

          {rightIcon ? (
            onPressRightIcon ? (
              <Pressable
                className="justify-center items-center px-3"
                onPress={onPressRightIcon}
                hitSlop={8}
              >
                {rightIcon}
              </Pressable>
            ) : (
              <View className="justify-center items-center px-3">{rightIcon}</View>
            )
          ) : null}
        </View>

        {errorMessage ? (
          <Text className="mt-1 ml-1 text-xs text-error">{errorMessage}</Text>
        ) : null}
      </View>
    );
  },
);

Input.displayName = 'Input';
