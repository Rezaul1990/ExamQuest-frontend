import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme, useThemeScheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  const scheme = useThemeScheme();

  return <View style={[{ backgroundColor: (scheme === 'dark' ? darkColor : lightColor) ?? theme[type ?? 'background'] }, style]} {...otherProps} />;
}
