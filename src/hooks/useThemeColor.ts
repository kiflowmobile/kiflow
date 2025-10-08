/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

// import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/src/constants/Colors';
import { useColorScheme } from './useColorScheme.web';

export function useThemeColor(
  // props: { light?: string; dark?: string },
  // colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  // const theme = useColorScheme() ?? 'light';
  const colorFromProps = 'light';

  // if (colorFromProps) {
    return colorFromProps;
  // } else {
  //   return Colors[theme][colorName];
  // }
}
