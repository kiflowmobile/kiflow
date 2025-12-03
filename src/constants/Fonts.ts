export const FONT_FAMILY = {
  primary: 'RobotoCondensed',
  secondary: 'Inter',
} as const;

export const FONT_SIZE = {
  xxs: 12,
  xs: 14,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 32,
} as const;


export const TEXT_VARIANTS = {
  title1: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  title2: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  title3: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  largeTitle: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
  },
  body1: {
    fontFamily: FONT_FAMILY.secondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '400',
  },
  body2: {
    fontFamily: FONT_FAMILY.secondary,
    fontSize: FONT_SIZE.xs,
    fontWeight: '400',
  },
  label: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },

  placeholder: {
    fontFamily: FONT_FAMILY.secondary,
    fontSize: FONT_SIZE.sm,
    fontWeight: '400',
  },
  button: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  caption: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.xxs,
  },
} as const;

export type TextVariant = keyof typeof TEXT_VARIANTS;
