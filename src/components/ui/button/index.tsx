import * as Haptics from 'expo-haptics';
import React from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../constants/Colors';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'error';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  image?: ImageSourcePropType;
  imagePosition?: 'left' | 'right';
  style?: any;
  textStyle?: any;
  hapticFeedback?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  image,
  imagePosition = 'left',
  style,
  textStyle,
  hapticFeedback = true,
}) => {
  const handlePress = () => {
    if (hapticFeedback && !disabled) {
      switch (variant) {
        case 'primary':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'secondary':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        default:
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    onPress();
  };

  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <Pressable
      style={({ pressed }) => [
        ...buttonStyle,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      <View style={styles.content}>
        {image && imagePosition === 'left' && (
          <Image source={image} style={styles.image} />
        )}
        <Text style={textStyleCombined}>{title}</Text>
        {image && imagePosition === 'right' && (
          <Image source={image} style={styles.image} />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
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
  text: {
    fontWeight: '600',
    textAlign: 'center',
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

  // Variants
  primary: {
    backgroundColor: Colors.black,
    borderWidth: 2,
    borderColor: Colors.black,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.black,
  },
  success: {
    backgroundColor: Colors.success,
    borderWidth: 0,
  },
  error: {
    backgroundColor: Colors.error,
    borderWidth: 0,
  },

  // Text colors for variants
  primaryText: {
    color: Colors.white,
  },
  secondaryText: {
    color: Colors.black,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  successText: {
    color: Colors.white,
  },
  errorText: {
    color: Colors.white,
  },
  sm: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    minHeight: 16,
  },
  md: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    minHeight: 36,
  },
  lg: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    minHeight: 48,
  },
  smText: {
    fontSize: 14,
  },
  mdText: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
  lgText: {
    fontSize: 18,
    letterSpacing: 0.5,
  },
});

export default Button;