// src/theme/fonts.ts

// 1. Имена шрифтов (ровно те, что в useFonts)
export const FONT_FAMILY = {
  primary: 'RobotoCondensed',
  secondary: 'Inter',
} as const;

// 2. Размеры шрифтов
export const FONT_SIZE = {
  xs: 12,
  sm: 16,
  md: 18,
  lg: 20,
  xl: 32,
} as const;

// 3. Line-height (можно в числах или коэффициентами)
export const LINE_HEIGHT = {
  xs: 16,
  sm: 20,
  md: 22,
  lg: 24,
  xl: 32,
} as const;

// 4. Готовые текстовые пресеты (типография)
export const TEXT_VARIANTS = {
  title1: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.lg,
    lineHeight: LINE_HEIGHT.lg,
    fontWeight: '600',
  },
  title3: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.sm,
    lineHeight: LINE_HEIGHT.sm,
    fontWeight: '500',
  },
  largeTitle: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.xl,
    lineHeight: LINE_HEIGHT.md,
    fontWeight: '600',
  },
  placeholder: {
    fontFamily: FONT_FAMILY.secondary,
    fontSize: FONT_SIZE.sm,
    lineHeight: LINE_HEIGHT.sm,
    fontWeight: '400',
  },
  button: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.md,
    lineHeight: LINE_HEIGHT.md,
    fontWeight: '600',
  },
  caption: {
    fontFamily: FONT_FAMILY.primary,
    fontSize: FONT_SIZE.xs,
    lineHeight: LINE_HEIGHT.xs,
  },
} as const;

export type TextVariant = keyof typeof TEXT_VARIANTS;
