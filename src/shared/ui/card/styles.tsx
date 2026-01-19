import { tva } from '@gluestack-ui/nativewind-utils/tva';
import { Platform } from 'react-native';
const isWeb = Platform.OS === 'web';
const baseStyle = isWeb ? 'flex flex-col relative z-0' : '';

export const cardStyle = tva({
  base: `${baseStyle} transition-shadow duration-200`,
  variants: {
    size: {
      sm: 'p-3 rounded-md',
      md: 'p-4 rounded-lg',
      lg: 'p-6 rounded-lg',
    },
    variant: {
      elevated: 'bg-white box-shadow-md data-[hover=true]:box-shadow-lg',
      outline: 'bg-white border border-neutral-200 box-shadow-sm data-[hover=true]:box-shadow-md',
      ghost: 'rounded-none bg-transparent',
      filled: 'bg-neutral-100 box-shadow-sm data-[hover=true]:box-shadow-md',
    },
  },
});
