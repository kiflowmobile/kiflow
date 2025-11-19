'use client';
import { PrimitiveIcon, UIIcon } from '@gluestack-ui/icon';
import { createInput } from '@gluestack-ui/input';
import { useStyleContext, withStyleContext } from '@gluestack-ui/nativewind-utils/withStyleContext';
import * as Haptics from 'expo-haptics';
import { cssInterop } from 'nativewind';
import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Colors } from '../../../constants/Colors';

const SCOPE = 'INPUT';

const styles = StyleSheet.create({
  inputContainer: {
    borderWidth: 1,
    borderColor: Colors.darkGray,
    borderRadius: 8,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  inputContainerFocused: {
    borderColor: Colors.darkGray,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  inputContainerHover: {
    borderColor: Colors.darkGray,
  },
  inputContainerDisabled: {
    opacity: 0.4,
  },
  inputField: {
    flex: 1,
    color: Colors.black,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    height: '100%',
  },
  inputFieldUnderlined: {
    paddingHorizontal: 0,
  },
  inputFieldRounded: {
    paddingHorizontal: 16,
  },
  inputIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    color: Colors.darkGray,
  },
  inputSlot: {
    justifyContent: 'center',
    alignItems: 'center',
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
    height: 44,
    minHeight: 44,
  },
  variantUnderlined: {
    borderRadius: 0,
    borderBottomWidth: 1,
    borderWidth: 0,
  },
  variantOutline: {
    borderRadius: 8,
    borderWidth: 1,
  },
  variantRounded: {
    borderRadius: 20,
    borderWidth: 1,
  },
});

const UIInput = createInput({
  Root: withStyleContext(View, SCOPE),
  Icon: UIIcon,
  Slot: Pressable,
  Input: TextInput,
});

cssInterop(PrimitiveIcon, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      height: true,
      width: true,
      fill: true,
      color: 'classNameColor',
      stroke: true,
    },
  },
});

type InputSize = 'sm' | 'md' | 'lg' | 'xl';
type InputVariant = 'outline' | 'underlined' | 'rounded';

type IInputProps = React.ComponentProps<typeof UIInput> & { 
  className?: string;
  style?: any;
  variant?: InputVariant;
  size?: InputSize;
  hapticFeedback?: boolean;
};

const Input = React.forwardRef<React.ComponentRef<typeof UIInput>, IInputProps>(function Input(
  { className, variant = 'outline', size = 'md', style, hapticFeedback = true, ...props },
  ref
) {
  const handleFocus = (event: any) => {
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (props.onFocus) {
      props.onFocus(event);
    }
  };

  const containerStyle = [
    styles.inputContainer,
    styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles],
    styles[`variant${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof styles],
    style,
  ];

  return (
    <UIInput
      ref={ref}
      {...props}
      style={containerStyle}
      context={{ variant, size }}
      onFocus={handleFocus}
    />
  );
});

type IInputIconProps = React.ComponentProps<typeof UIInput.Icon> & {
  className?: string;
  height?: number;
  width?: number;
  style?: any;
  size?: number | InputSize;
};

const InputIcon = React.forwardRef<React.ComponentRef<typeof UIInput.Icon>, IInputIconProps>(
  function InputIcon({ className, size, style, ...props }, ref) {
    const iconStyle = [
      styles.inputIcon,
      style,
    ];

    if (typeof size === 'number') {
      return (
        <UIInput.Icon
          ref={ref}
          {...props}
          style={iconStyle}
          size={size}
        />
      );
    } else if ((props.height !== undefined || props.width !== undefined) && size === undefined) {
      return <UIInput.Icon ref={ref} {...props} style={iconStyle} />;
    }
    return (
      <UIInput.Icon
        ref={ref}
        {...props}
        style={iconStyle}
      />
    );
  }
);

type IInputSlotProps = React.ComponentProps<typeof UIInput.Slot> & { 
  className?: string;
  style?: any;
};

const InputSlot = React.forwardRef<React.ComponentRef<typeof UIInput.Slot>, IInputSlotProps>(
  function InputSlot({ className, style, ...props }, ref) {
    const slotStyle = [
      styles.inputSlot,
      style,
    ];

    return (
      <UIInput.Slot
        ref={ref}
        {...props}
        style={slotStyle}
      />
    );
  }
);

type IInputFieldProps = React.ComponentProps<typeof UIInput.Input> & { 
  className?: string;
  style?: any;
};

const InputField = React.forwardRef<React.ComponentRef<typeof UIInput.Input>, IInputFieldProps>(
  function InputField({ className, style, ...props }, ref) {
    const { variant: parentVariant } = useStyleContext(SCOPE);

    const fieldStyle = [
      styles.inputField,
      parentVariant === 'underlined' && styles.inputFieldUnderlined,
      parentVariant === 'rounded' && styles.inputFieldRounded,
      style,
    ];

    return (
      <UIInput.Input
        ref={ref}
        {...props}
        style={fieldStyle}
        placeholderTextColor={Colors.darkGray}
      />
    );
  }
);

Input.displayName = 'Input';
InputIcon.displayName = 'InputIcon';
InputSlot.displayName = 'InputSlot';
InputField.displayName = 'InputField';

export { Input, InputField, InputIcon, InputSlot };
