import { View } from 'react-native';
import { ActionSurface } from '@/components/ui/ActionSurface';
import { ThemedText } from '@/components/themed-text';
import { useAuthStyles } from '../Auth.styles';

export function AcademicChoices({ label, options, selected, disabled, onSelect }: { label: string; options: readonly { value: string; label: string }[]; selected: string; disabled: boolean; onSelect: (value: string) => void }) {
  const styles = useAuthStyles();
  return <View accessibilityRole="radiogroup" accessibilityLabel={label}>
    <ThemedText type="smallBold" style={styles.fieldLabel}>{label}</ThemedText>
    <View style={styles.permissionGrid}>{options.map((option) => <ActionSurface key={option.value} accessibilityRole="radio" accessibilityLabel={option.label} accessibilityState={{ checked: selected === option.value }} disabled={disabled} onPress={() => onSelect(option.value)} style={[styles.permissionItem, selected === option.value && styles.permissionItemSelected]}>
      <ThemedText>{selected === option.value ? '✓ ' : ''}{option.label}</ThemedText>
    </ActionSurface>)}</View>
  </View>;
}
