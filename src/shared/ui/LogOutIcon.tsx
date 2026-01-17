import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface LogOutIconProps {
  size?: number;
  color?: string;
}

export function LogOutIcon({ size = 24, color = '#000000' }: LogOutIconProps) {
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
      <Path d="M14 8v-2a2 2 0 0 0 -2 -2h-7a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2 -2v-2" />
      <Path d="M9 12h12l-3 -3" />
      <Path d="M18 15l3 -3" />
    </Svg>
  );
}
