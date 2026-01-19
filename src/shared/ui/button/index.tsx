import * as Haptics from 'expo-haptics';
import React, { ReactNode, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import clsx from 'clsx';

export type ButtonVariant = 'dark' | 'light' | 'accent' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

type VariantStateStyles = {
  container: ViewStyle;
  text: TextStyle;
  pressed?: {
    container?: ViewStyle;
    text?: TextStyle;
  };
  disabled?: {
    container?: ViewStyle;
    text?: TextStyle;
  };
};

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  image?: ImageSourcePropType;
  imagePosition?: 'left' | 'right';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  hapticFeedback?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}

/**
 * Вариант + состояния (default, pressed, disabled)
 * Only custom colors for pressed/disabled states that aren't in Tailwind
 */
const VARIANT_STYLES: Record<ButtonVariant, VariantStateStyles> = {
  dark: {
    container: {},
    text: {},
    pressed: {
      container: {
        backgroundColor: '#111111', // Slightly lighter black for pressed
      },
    },
    disabled: {
      container: {
        backgroundColor: '#d4d4d4',
        borderColor: '#d4d4d4',
      },
      text: {},
    },
  },
  light: {
    container: {},
    text: {},
    pressed: {
      container: {
        backgroundColor: '#f2f2f2', // Slightly darker white for pressed
      },
    },
    disabled: {
      container: {
        backgroundColor: '#e6e6e6',
      },
      text: {
        color: '#999999',
      },
    },
  },
  accent: {
    container: {},
    text: {},
    pressed: {
      container: {
        backgroundColor: '#5aa9ff', // Custom pressed color
      },
    },
    disabled: {
      container: {
        backgroundColor: '#8cbfff',
      },
      text: {
        color: '#333333',
      },
    },
  },
  outline: {
    container: {},
    text: {},
    pressed: {
      container: {
        backgroundColor: 'rgba(255,255,255,0.08)',
      },
    },
    disabled: {
      container: {
        borderColor: 'rgba(255,255,255,0.4)',
        backgroundColor: 'transparent',
      },
      text: {
        color: 'rgba(255,255,255,0.6)',
      },
    },
  },
};

const SIZE_STYLES: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      minHeight: 32,
    },
    text: {
      fontSize: 14,
    },
  },
  md: {
    container: {
      paddingVertical: 8,
      paddingHorizontal: 24,
      minHeight: 48,
    },
    text: {
      fontSize: 18,
      letterSpacing: 0.5,
    },
  },
  lg: {
    container: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      minHeight: 56,
    },
    text: {
      fontSize: 18,
      lineHeight: 24,
      letterSpacing: 0,
    },
  },
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'dark',
  size = 'md',
  disabled = false,
  image,
  imagePosition = 'left',
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  hapticFeedback = true,
  loading = false,
  accessibilityLabel,
}) => {
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (isDisabled) return;

    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }

    onPress();
  };

  const variantTheme = VARIANT_STYLES[variant] ?? VARIANT_STYLES.dark;
  const sizeTheme = SIZE_STYLES[size] ?? SIZE_STYLES.md;

  const adornment = useMemo(
    () => ({
      left:
        icon && iconPosition === 'left' ? (
          <View className="mx-2">{icon}</View>
        ) : image && imagePosition === 'left' ? (
          <Image source={image} className="w-5 h-5 mx-2" />
        ) : null,
      right:
        icon && iconPosition === 'right' ? (
          <View className="mx-2">{icon}</View>
        ) : image && imagePosition === 'right' ? (
          <Image source={image} className="w-5 h-5 mx-2" />
        ) : null,
    }),
    [icon, iconPosition, image, imagePosition],
  );

  // Проверяем, есть ли flex в стиле
  const styleArray = Array.isArray(style) ? style : style ? [style] : [];
  const hasFlex = styleArray.some(
    (s) =>
      s &&
      typeof s === 'object' &&
      s !== null &&
      ('flex' in s || 'flexGrow' in s || 'alignSelf' in s),
  );

  const pressableContent = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={handlePress}
    >
      {({ pressed }) => {
        const isPressed = pressed && !isDisabled;

        const baseClasses = 'rounded-md border-2 items-center justify-center flex-row';
        const sizeClasses = {
          sm: 'py-1 px-2 min-h-[32px]',
          md: 'py-2 px-6 min-h-[48px]',
          lg: 'py-4 px-6 min-h-[56px]',
        };
        const variantClasses = {
          dark: 'bg-black border-black',
          light: 'bg-surface border-surface',
          accent: 'bg-primary-light border-primary-light',
          outline: 'bg-transparent border-surface',
        };

        return (
          <View
            className={clsx(
              baseClasses,
              sizeClasses[size],
              variantClasses[variant],
              isDisabled && variant === 'dark' && 'bg-gray-400 border-gray-400',
              isDisabled && variant === 'light' && 'bg-gray-200',
              isDisabled && variant === 'accent' && 'bg-blue-400',
              isDisabled && 'opacity-40',
            )}
            style={[
              sizeTheme.container,
              isPressed && variantTheme.pressed?.container,
              isDisabled && variantTheme.disabled?.container,
              !hasFlex && style,
            ]}
          >
            <View className="flex-row items-center justify-center">
              {adornment.left}

              <Text
                className={clsx(
                  'font-primary font-semibold text-center',
                  size === 'sm' && 'text-sm',
                  (size === 'md' || size === 'lg') && 'text-md',
                  variant === 'dark' && (isDisabled ? 'text-white' : 'text-white'),
                  variant === 'light' && (isDisabled ? 'text-gray-500' : 'text-black'),
                  variant === 'accent' && (isDisabled ? 'text-gray-800' : 'text-black'),
                  variant === 'outline' && (isDisabled ? 'text-white/60' : 'text-white'),
                  isDisabled && 'opacity-60',
                )}
                style={[
                  sizeTheme.text,
                  isPressed && variantTheme.pressed?.text,
                  isDisabled && variantTheme.disabled?.text,
                  textStyle,
                ]}
              >
                {title}
              </Text>

              {loading && (
                <ActivityIndicator
                  className="ml-2"
                  color={
                    (isDisabled ? variantTheme.disabled?.text?.color : variantTheme.text?.color) ||
                    '#FFFFFF'
                  }
                  size="small"
                />
              )}

              {adornment.right}
            </View>
          </View>
        );
      }}
    </Pressable>
  );

  // Если есть flex, оборачиваем в View для правильного растягивания
  if (hasFlex) {
    return <View style={style}>{pressableContent}</View>;
  }

  return pressableContent;
};
