import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface CloseIconProps {
  size?: number;
  color?: string;
}

export function CloseIcon({ size = 24, color = '#000000' }: CloseIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M18 6l-12 12" />
      <Path d="M6 6l12 12" />
    </Svg>
  );
}
