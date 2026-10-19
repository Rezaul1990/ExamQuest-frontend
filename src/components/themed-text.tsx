import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, Typography, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'sectionTitle' | 'caption' | 'link' | 'linkPrimary' | 'code' | 'question' | 'option' | 'explanation';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={0}
      adjustsFontSizeToFit={false}
      textBreakStrategy="highQuality"
      lineBreakStrategyIOS="standard"
      style={[
        styles.base,
        { color: theme[themeColor ?? (type === 'linkPrimary' ? 'brandPrimary' : 'textPrimary')] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'sectionTitle' && styles.sectionTitle,
        type === 'caption' && styles.caption,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        type === 'question' && styles.question,
        type === 'option' && styles.option,
        type === 'explanation' && styles.explanation,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
    ...Platform.select({ web: { fontFamily: Fonts.sans }, android: { includeFontPadding: true } }),
  },
  ...Typography,
  linkPrimary: Typography.link,
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
