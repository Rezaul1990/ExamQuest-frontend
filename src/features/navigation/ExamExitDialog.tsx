import { Modal, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/features/auth/components/AuthFields';
import { ExamQuestColors, Spacing } from '@/constants/theme';

export function ExamExitDialog({ mode, busy, onDismiss, onConfirm }: { mode: 'leave' | 'blocked' | null; busy: boolean; onDismiss: () => void; onConfirm: () => void }) {
  return <Modal visible={!!mode} transparent animationType="fade" onRequestClose={onDismiss}>
    <View style={styles.scrim}><View accessibilityViewIsModal style={styles.dialog}>
      <ThemedText type="sectionTitle">{mode === 'leave' ? 'Leave exam?' : 'Exam in progress'}</ThemedText>
      <ThemedText>{mode === 'leave' ? 'Save your answers and leave this exam? Its server timer will continue.' : 'Your exam timer is running. Use Back to papers to save your answers and confirm leaving.'}</ThemedText>
      <AuthButton label="Continue exam" disabled={busy} onPress={onDismiss} variant="secondary" />
      {mode === 'leave' && <AuthButton label={busy ? 'Saving...' : 'Save and leave'} disabled={busy} onPress={onConfirm} />}
    </View></View>
  </Modal>;
}
const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.three, backgroundColor: 'rgba(15,23,42,0.4)' },
  dialog: { width: '100%', maxWidth: 420, borderRadius: 12, padding: Spacing.four, gap: Spacing.three, backgroundColor: ExamQuestColors.surface },
});
