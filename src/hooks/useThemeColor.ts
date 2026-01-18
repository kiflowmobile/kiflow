import { useColorScheme } from './useColorScheme.web';
import { Colors } from '@/src/constants/Colors';

export function useThemeColor(
  props?: { light?: string; dark?: string },
  colorName?: string
): string {
  const colorScheme = useColorScheme();
  
  if (props) {
    return colorScheme === 'dark' ? (props.dark || props.light || Colors.white) : (props.light || Colors.white);
  }
  
  // Default colors based on color name
  const defaultColors: Record<string, { light: string; dark: string }> = {
    background: { light: Colors.bg, dark: Colors.black },
    text: { light: Colors.black, dark: Colors.white },
  };
  
  if (colorName && defaultColors[colorName]) {
    return colorScheme === 'dark' ? defaultColors[colorName].dark : defaultColors[colorName].light;
  }
  
  return Colors.white;
}
