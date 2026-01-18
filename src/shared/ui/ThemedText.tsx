import { useThemeColor } from '@/src/hooks/useThemeColor';
import { Text, type TextProps } from 'react-native';
import clsx from 'clsx';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  className?: string;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  className,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor();

  const typeClasses = {
    default: 'text-base leading-6',
    defaultSemiBold: 'text-base leading-6 font-semibold',
    title: 'text-3xl font-bold leading-8',
    subtitle: 'text-lg font-bold',
    link: 'text-base leading-8',
  };

  return (
    <Text
      className={clsx(typeClasses[type], className)}
      style={[{ color }, type === 'link' && { color: '#0a7ea4' }, style]}
      {...rest}
    />
  );
}
