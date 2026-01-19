import { useColorScheme } from './useColorScheme.web';

// Color values from tailwind.config.js
// These are used for inline styles when className isn't suitable (e.g., dynamic colors)
const COLORS = {
  white: '#FFFFFF', // surface
  black: '#0A0A0A', // black
  bg: '#F4F4F4', // background
} as const;

export function useThemeColor(
  props?: { light?: string; dark?: string },
  colorName?: string,
): string {
  const colorScheme = useColorScheme();

  if (props) {
    return colorScheme === 'dark'
      ? props.dark || props.light || COLORS.white
      : props.light || COLORS.white;
  }

  // Default colors based on color name
  const defaultColors: Record<string, { light: string; dark: string }> = {
    background: { light: COLORS.bg, dark: COLORS.black },
    text: { light: COLORS.black, dark: COLORS.white },
  };

  if (colorName && defaultColors[colorName]) {
    return colorScheme === 'dark' ? defaultColors[colorName].dark : defaultColors[colorName].light;
  }

  return COLORS.white;
}
