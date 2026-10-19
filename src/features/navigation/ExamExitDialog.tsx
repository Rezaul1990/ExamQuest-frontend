import { useThemeScheme } from '@/hooks/use-theme';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FeedbackNotice } from '@/components/FeedbackNotice';
import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/features/auth/components/AuthFields';
import { Colors, type ThemePalette, Spacing } from '@/constants/theme';

export function ExamExitDialog({ mode, busy, error, onDismiss, onConfirm }: { mode: 'leave' | 'blocked' | null; busy: boolean; error?: string | null; onDismiss: () => void; onConfirm: () => void }) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return <Modal visible={!!mode} transparent animationType="fade" onRequestClose={() => { if (!busy) onDismiss(); }}>
    <View style={[styles.scrim, { paddingTop: insets.top + Spacing.three, paddingBottom: insets.bottom + Spacing.three, paddingLeft: insets.left + Spacing.three, paddingRight: insets.right + Spacing.three }]}><View accessibilityViewIsModal style={styles.dialog}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ThemedText type="sectionTitle">{mode === 'leave' ? 'Leave exam?' : 'Exam in progress'}</ThemedText>
      <ThemedText>{mode === 'leave' ? 'Save your answers and leave this exam? Its server timer will continue.' : 'Your exam timer is running. Use Back to papers to save your answers and confirm leaving.'}</ThemedText>
      {!!error && <FeedbackNotice kind="error" title="Could not leave exam" message={error} />}
      <AuthButton label="Continue exam" disabled={busy} onPress={onDismiss} variant="secondary" />
      {mode === 'leave' && <AuthButton label={busy ? 'Saving...' : 'Save and leave'} disabled={busy} onPress={onConfirm} />}
    </ScrollView></View></View>
  </Modal>;
}
function createStyles(ExamQuestColors: ThemePalette) { return StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.three, backgroundColor: ExamQuestColors.scrim },
  dialog: { width: '100%', maxWidth: 420, maxHeight: '100%', flexShrink: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: ExamQuestColors.surface },
  content: { padding: Spacing.four, gap: Spacing.three },
}); }
const stylesByScheme = { light: createStyles(Colors.light), dark: createStyles(Colors.dark) };
function useStyles() { return stylesByScheme[useThemeScheme()]; }
