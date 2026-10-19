/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { createContext, useContext } from 'react';
import { Colors, resolveThemeScheme, type ThemePalette, type ThemeScheme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ThemeContext = createContext<ThemeScheme | 'system'>('system');
export const ThemeScope = ThemeContext.Provider;

export function useThemeScheme(): ThemeScheme {
  const scoped = useContext(ThemeContext);
  const scheme = useColorScheme();
  return resolveThemeScheme(scoped === 'system' ? scheme : scoped);
}

export function useTheme(): ThemePalette {
  return Colors[useThemeScheme()];
}
