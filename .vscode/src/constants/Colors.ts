/**
 * Below are the colors that are used in the app. The colors are defined based on the design system.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// Основні кольори
const black = '#000000';
const white = '#FFFFFF';

// Сіра палітра
const gray = {
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#EEEEEE',
  300: '#E0E0E0',
  400: '#BDBDBD',
  500: '#9E9E9E',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
};

// Акцентний колір
const tintColor = '#0a7ea4';

export const Colors = {
  // Основні кольори
  black,
  white,
  gray,
  
  // Кольори інтерфейсу
  text: black,
  background: white,
  tint: tintColor,
  icon: gray[600],
  tabIconDefault: gray[600],
  tabIconSelected: tintColor,
  
  // Додаткові кольори для зручності
  border: gray[300],
  placeholder: gray[400],
  disabled: gray[300],
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};
