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
 * Статические стили для вариантов (как в Figma):
 * - dark    — чёрная заливка
 * - light   — белая заливка
 * - accent  — сиреневая/голубая заливка
 * - outline — прозрачный фон + белая обводка
 */
const VARIANT_STYLES: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  dark: {
    container: {
      backgroundColor: Colors.black,
    },
    text: {
      color: Colors.white,
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
  },
  accent: {
    container: {
      backgroundColor: Colors.blue,
    },
    text: {
      color: Colors.black,
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
    if (isDisabled) {
      return;
    }
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }
    onPress();
  };

  const variantTheme = VARIANT_STYLES[variant];
  const sizeTheme = SIZE_STYLES[size];

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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        variantTheme.container,
        sizeTheme.container,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      <View style={styles.content}>
        {adornment.left}

        <Text
          style={[
            styles.text,
            variantTheme.text,
            sizeTheme.text,
            isDisabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>

        {loading && (
          <ActivityIndicator style={styles.spinner} color={variantTheme.text.color} size="small" />
        )}

        {adornment.right}
      </View>
    </Pressable>
  );
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
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
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
