import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface CheckIconProps {
  size?: number;
  color?: string;
}

export function CheckIcon({ size = 24, color = '#000000' }: CheckIconProps) {
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
      <Path d="M5 12l5 5l10 -10" />
    </Svg>
  );
}
