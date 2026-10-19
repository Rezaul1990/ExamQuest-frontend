/**
 * Semantic design foundation. Colors.light/dark share keys; ExamQuestColors
 * remains a static light compatibility alias for older tooling/specimens.
 */

import '@/global.css';

import { Platform } from 'react-native';

const palettes = {
  light: {
    background: '#F6F8FA',
    surface: '#FFFFFF',
    surfaceSoft: '#F1F5F4',
    surfaceSelected: '#E7F4EE',
    textPrimary: '#0F172A',
    textSecondary: '#5B6472',
    textMuted: '#626E80',
    border: '#D8DEE8',
    borderStrong: '#B8C0CC',
    brandPrimary: '#146C5D',
    brandPressed: '#0F584C',
    onBrandPrimary: '#FFFFFF',
    success: '#157347',
    successSoft: '#E7F4EE',
    warning: '#875900',
    warningSoft: '#FFF4D6',
    error: '#A73535',
    errorPressed: '#872929',
    errorSoft: '#FCE8E6',
    onError: '#FFFFFF',
    info: '#2458A6',
    infoSoft: '#E8F0FE',
    focusRing: '#146C5D',
    scrim: 'rgba(15,23,42,0.25)',
  },
  dark: {
    background: '#0C1714',
    surface: '#14251F',
    surfaceSoft: '#1C3029',
    surfaceSelected: '#24483C',
    textPrimary: '#EBF3EF',
    textSecondary: '#BDCEC6',
    textMuted: '#A4B8AE',
    border: '#354D43',
    borderStrong: '#6C887A',
    brandPrimary: '#70D6B5',
    brandPressed: '#53BE9C',
    onBrandPrimary: '#082B21',
    success: '#81D6A3',
    successSoft: '#183C29',
    warning: '#F4CB72',
    warningSoft: '#3D3017',
    error: '#FFB4AB',
    errorPressed: '#F59B91',
    errorSoft: '#47251F',
    onError: '#3B0904',
    info: '#AAC7FF',
    infoSoft: '#1D324F',
    focusRing: '#70D6B5',
    scrim: 'rgba(0,0,0,0.6)',
  },
} as const;

// Keep starter aliases and the static light export compatible for existing tooling.
function withAliases<T extends typeof palettes.light | typeof palettes.dark>(palette: T) {
  return { ...palette, text: palette.textPrimary, backgroundElement: palette.surface, backgroundSelected: palette.surfaceSelected };
}
export const Colors = { light: withAliases(palettes.light), dark: withAliases(palettes.dark) } as const;
export type ThemeScheme = keyof typeof Colors;
export type ThemePalette = { readonly [K in keyof typeof Colors.light]: string };
export type ThemeColor = keyof ThemePalette;
export function resolveThemeScheme(scheme: string | null | undefined): ThemeScheme {
  return scheme === 'dark' ? 'dark' : 'light';
}

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

export const ExamQuestColors = Colors.light;

export const Radius = {
  sm: 6,
  md: 8,
  lg: 12,
  pill: 999,
} as const;

export const Typography = {
  default: { fontSize: 16, lineHeight: 28, fontWeight: '400' },
  title: { fontSize: 36, lineHeight: 50, fontWeight: '700' },
  subtitle: { fontSize: 26, lineHeight: 40, fontWeight: '700' },
  sectionTitle: { fontSize: 18, lineHeight: 30, fontWeight: '700' },
  small: { fontSize: 14, lineHeight: 24, fontWeight: '400' },
  smallBold: { fontSize: 14, lineHeight: 24, fontWeight: '700' },
  caption: { fontSize: 12, lineHeight: 20, fontWeight: '500' },
  link: { fontSize: 14, lineHeight: 30 },
  button: { fontSize: 16, lineHeight: 28, fontWeight: '700' },
  question: { fontSize: 18, lineHeight: 32, fontWeight: '600' },
  option: { fontSize: 16, lineHeight: 28, fontWeight: '400' },
  explanation: { fontSize: 16, lineHeight: 28, fontWeight: '400' },
  tab: { fontSize: 11, lineHeight: 16, fontWeight: '600' },
} as const;

// RN shadow props cover iOS/web; elevation covers Android. No extra native package.
export const Elevation = {
  none: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  card: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  raised: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2 },
  floating: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 3 },
} as const;

export const ControlSize = { touch: 44, input: 48, button: 54, header: 56, icon: 22 } as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 560;
