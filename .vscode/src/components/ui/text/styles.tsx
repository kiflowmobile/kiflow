import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { Platform } from 'react-native';
const isWeb = Platform.OS === 'web';

const baseStyle = isWeb
  ? 'font-sans tracking-sm my-0 bg-transparent border-0 box-border display-inline list-none margin-0 padding-0 position-relative text-start no-underline whitespace-pre-wrap word-wrap-break-word'
  : '';

export const textStyle = tva({
  base: `text-typography-700 leading-relaxed font-body ${baseStyle}`,

  variants: {
    isTruncated: {
      true: 'web:truncate',
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
    size: {
      '2xs': 'text-2xs leading-tight',
      xs: 'text-xs leading-snug',
      sm: 'text-sm leading-normal',
      md: 'text-base leading-relaxed',
      lg: 'text-lg leading-relaxed font-medium',
      xl: 'text-xl leading-relaxed font-medium',
      '2xl': 'text-2xl leading-normal font-semibold',
      '3xl': 'text-3xl leading-normal font-semibold',
      '4xl': 'text-4xl leading-normal font-bold',
      '5xl': 'text-5xl leading-tight font-bold',
      '6xl': 'text-6xl leading-tight font-bold',
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
  },
});
