import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { Platform } from 'react-native';
const isWeb = Platform.OS === 'web';
const baseStyle = isWeb
  ? 'font-sans tracking-sm bg-transparent border-0 box-border display-inline list-none margin-0 padding-0 position-relative text-start no-underline whitespace-pre-wrap word-wrap-break-word'
  : '';

export const headingStyle = tva({
  base: `text-typography-900 font-bold font-heading tracking-sm my-0 leading-tight ${baseStyle}`,
  variants: {
    isTruncated: {
      true: 'truncate',
    },
    bold: {
      true: 'font-bold',
    },
    underline: {
      true: 'underline',
    },
    strikeThrough: {
      true: 'line-through',
    },
    sub: {
      true: 'text-xs',
    },
    italic: {
      true: 'italic',
    },
    highlight: {
      true: 'bg-yellow-500',
    },
    size: {
      '5xl': 'text-6xl font-bold leading-tight',
      '4xl': 'text-5xl font-bold leading-tight',
      '3xl': 'text-4xl font-bold leading-normal',
      '2xl': 'text-2xl font-bold leading-normal',
      xl: 'text-xl font-bold leading-normal',
      lg: 'text-lg font-bold leading-normal',
      md: 'text-base font-semibold leading-normal',
      sm: 'text-sm font-semibold leading-normal',
      xs: 'text-xs font-semibold leading-normal',
    },
  },
});
