'use client';
import { ActivityIndicator } from 'react-native';
import React from 'react';
import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { cssInterop } from 'nativewind';
import type { VariantProps } from '@gluestack-ui/nativewind-utils';

cssInterop(ActivityIndicator, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

const spinnerStyle = tva({
  base: 'transition-all duration-200 ease-in-out',
  variants: {
    size: {
      xs: 'scale-50',
      sm: 'scale-75',
      md: '',
      lg: 'scale-125',
      xl: 'scale-150',
    },
    colorScheme: {
      primary: 'text-primary-500',
      neutral: 'text-neutral-500',
      success: 'text-success-500',
      error: 'text-error-500',
      warning: 'text-warning-500',
    },
  },
  defaultVariants: {
    size: 'md',
    colorScheme: 'primary',
  },
});

export const SPINNER_SIZES = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
} as const;

export type SpinnerSize = keyof typeof SPINNER_SIZES;

type SpinnerProps = Omit<React.ComponentProps<typeof ActivityIndicator>, 'size'> &
  VariantProps<typeof spinnerStyle> & {
    size?: SpinnerSize;
  };

const Spinner = React.forwardRef<React.ComponentRef<typeof ActivityIndicator>, SpinnerProps>(
  function Spinner(
    {
      className,
      size = SPINNER_SIZES.md,
      colorScheme = 'primary',
      focusable = false,
      'aria-label': ariaLabel = 'loading',
      ...props
    },
    ref
  ) {
    // Using the properly typed size value
    const sizeValue = size;

    return (
      <ActivityIndicator
        ref={ref}
        focusable={focusable}
        aria-label={ariaLabel}
        {...props}
        className={spinnerStyle({ size: sizeValue, colorScheme, class: className })}
      />
    );
  }
);

Spinner.displayName = 'Spinner';

export { Spinner };
