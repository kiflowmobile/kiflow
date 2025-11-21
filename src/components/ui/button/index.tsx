import * as Haptics from 'expo-haptics';
import React, { ReactNode, useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../../constants/Colors';
import { FONT_FAMILY, FONT_SIZE, TEXT_VARIANTS } from '@/src/constants/Fonts';

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
 */
const VARIANT_STYLES: Record<ButtonVariant, VariantStateStyles> = {
  dark: {
    container: {
      backgroundColor: Colors.black,
      borderColor: Colors.black,
    },
    text: {
      color: Colors.white,
    },
    pressed: {
      container: {
        backgroundColor: '#111111',
      },
    },
    disabled: {
      container: {
        backgroundColor: '#d4d4d4',
        borderColor: '#d4d4d4',
      },
      text: {
        color: Colors.white,
      },
    },
  },
  light: {
    container: {
      backgroundColor: Colors.white,
      borderColor: Colors.white,
    },
    text: {
      color: Colors.black,
    },
    pressed: {
      container: {
        backgroundColor: '#f2f2f2',
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
    container: {
      backgroundColor: Colors.buttonBlue,
      borderColor: Colors.buttonBlue,
    },
    text: {
      color: Colors.black,
    },
    pressed: {
      container: {
        backgroundColor: '#5aa9ff',
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
    container: {
      backgroundColor: 'transparent',
      borderColor: Colors.white,
    },
    text: {
      color: Colors.white,
      fontSize: FONT_SIZE.lg,
    },
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
      minHeight: 40,
    },
    text: {
      fontSize: 16,
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

const Button: React.FC<ButtonProps> = ({
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
          <View style={styles.iconWrapper}>{icon}</View>
        ) : image && imagePosition === 'left' ? (
          <Image source={image} style={styles.image} />
        ) : null,
      right:
        icon && iconPosition === 'right' ? (
          <View style={styles.iconWrapper}>{icon}</View>
        ) : image && imagePosition === 'right' ? (
          <Image source={image} style={styles.image} />
        ) : null,
    }),
    [icon, iconPosition, image, imagePosition],
  );

  // Проверяем, есть ли flex в стиле
  const styleArray = Array.isArray(style) ? style : style ? [style] : [];
  const hasFlex = styleArray.some(
    (s) => s && typeof s === 'object' && s !== null && ('flex' in s || 'flexGrow' in s || 'alignSelf' in s),
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

        return (
          <View
            style={[
              styles.base,
              variantTheme.container,
              sizeTheme.container,
              isPressed && variantTheme.pressed?.container,
              isDisabled && (variantTheme.disabled?.container || styles.disabled),
              !hasFlex && style,
            ]}
          >
            <View style={styles.content}>
              {adornment.left}

              <Text
                style={[
                  styles.text,
                  variantTheme.text,
                  sizeTheme.text,
                  isPressed && variantTheme.pressed?.text,
                  isDisabled && (variantTheme.disabled?.text || styles.disabledText),
                  textStyle,
                ]}
              >
                {title}
              </Text>

              {loading && (
                <ActivityIndicator
                  style={styles.spinner}
                  color={
                    (isDisabled ? variantTheme.disabled?.text?.color : variantTheme.text?.color) ||
                    Colors.white
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

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 20,
    height: 20,
    marginHorizontal: 8,
  },
  iconWrapper: {
    marginHorizontal: 8,
  },
  text: {
    ...TEXT_VARIANTS.button,
    textAlign: 'center',
    fontFamily: FONT_FAMILY.primary,
  },
  disabled: {
    opacity: 0.4,
  },
  disabledText: {
    opacity: 0.6,
  },
  spinner: {
    marginLeft: 8,
  },
});

export default Button;
