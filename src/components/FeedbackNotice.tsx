import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { AuthButton } from '@/features/auth/components/AuthFields';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  kind: 'loading' | 'empty' | 'error' | 'success' | 'info';
  title: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  busy?: boolean;
  onDismiss?: () => void;
};

/** Inline feedback follows the existing notice pattern; actions remain owned by callers. */
export function FeedbackNotice({ kind, title, message, onRetry, retryLabel = 'Try again', busy = false, onDismiss }: Props) {
  const theme = useTheme();
  const foreground = kind === 'error' ? theme.error : kind === 'success' ? theme.success : theme.textPrimary;
  const background = kind === 'error' ? theme.errorSoft : kind === 'success' ? theme.successSoft : theme.surfaceSoft;
  return <View accessibilityRole={kind === 'error' ? 'alert' : undefined}
    accessibilityLiveRegion={kind === 'error' ? 'assertive' : 'polite'}
    aria-live={kind === 'error' ? 'assertive' : 'polite'} aria-busy={kind === 'loading' || busy}
    style={[styles.notice, { backgroundColor: background, borderColor: theme.border }]}>
    {kind === 'loading' && <ActivityIndicator color={theme.brandPrimary} accessibilityLabel={title} />}
    <ThemedText type="smallBold" style={{ color: foreground }}>{title}</ThemedText>
    {!!message && <ThemedText type="small" style={{ color: foreground }}>{message}</ThemedText>}
    {kind === 'error' && onRetry && <AuthButton label={retryLabel} onPress={onRetry} busy={busy} disabled={busy} variant="secondary" />}
    {onDismiss && <AuthButton label="Dismiss message" onPress={onDismiss} variant="secondary" />}
  </View>;
}
const styles = StyleSheet.create({ notice: { padding: Spacing.three, gap: Spacing.two, borderWidth: 1, borderRadius: Radius.md } });
