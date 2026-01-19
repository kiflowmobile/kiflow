import { Svg, Path } from 'react-native-svg';

interface BookIconProps {
  size?: number;
  color?: string;
}

export function BookIcon({ size = 24, color = '#000000' }: BookIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
      <Path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
      <Path d="M3 6l0 13" />
      <Path d="M12 6l0 13" />
      <Path d="M21 6l0 13" />
    </Svg>
  );
}
