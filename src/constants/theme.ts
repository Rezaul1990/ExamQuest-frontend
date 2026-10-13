/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F6F8FA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E7F4EE',
    textSecondary: '#5B6472',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  twoHalf: 12,
  three: 16,
  threeHalf: 20,
  four: 24,
  five: 32,
  fiveHalf: 40,
  six: 48,
  seven: 64,
} as const;

export const ExamQuestColors = {
  background: '#F6F8FA',
  surface: '#FFFFFF',
  surfaceSoft: '#F1F5F4',
  surfaceSelected: '#E7F4EE',
  textPrimary: '#0F172A',
  textSecondary: '#5B6472',
  textMuted: '#7D8794',
  border: '#D8DEE8',
  borderStrong: '#B8C0CC',
  brandPrimary: '#146C5D',
  brandPressed: '#0F584C',
  onBrandPrimary: '#FFFFFF',
  success: '#157347',
  successSoft: '#E7F4EE',
  warning: '#9A6700',
  warningSoft: '#FFF4D6',
  error: '#A73535',
  errorSoft: '#FCE8E6',
  info: '#2458A6',
  infoSoft: '#E8F0FE',
} as const;

export const Radius = {
  sm: 6,
  md: 8,
  lg: 12,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 560;
