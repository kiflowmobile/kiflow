import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface EditIconProps {
  size?: number;
  color?: string;
}

export default function EditIcon({ size = 24, color = '#000000' }: EditIconProps) {
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
      <Path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" />
      <Path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" />
      <Path d="M16 5l3 3" />
    </Svg>
  );
}
