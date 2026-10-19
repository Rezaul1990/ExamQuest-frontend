import { View } from 'react-native';
import { ActionSurface } from '@/components/ui/ActionSurface';
import { FeedbackNotice } from '@/components/FeedbackNotice';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme, useThemeScheme } from '@/hooks/use-theme';
import { useAppearance, type AppearancePreference } from '@/store/stores/appearanceStore';

export function AppearanceSettings() {
  const { preference, hydrated, saving, error, failure, hydrate, setPreference } = useAppearance();
  const theme = useTheme();
  const scheme = useThemeScheme();
  return <View style={{ gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.md, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }}>
    <ThemedText type="smallBold">Appearance</ThemedText>
    <ThemedText type="caption">System follows your device. Your choice applies on this device, including after signing out.</ThemedText>
    <View accessibilityRole="radiogroup" accessibilityLabel="Appearance" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
      {(['system', 'light', 'dark'] as AppearancePreference[]).map(value => <ActionSurface key={value}
        accessibilityRole="radio" accessibilityLabel={`${value[0].toUpperCase() + value.slice(1)} appearance`}
        accessibilityState={{ checked: preference === value }} disabled={!hydrated}
        onPress={() => { void setPreference(value); }}
        style={{ padding: Spacing.twoHalf, borderRadius: Radius.sm, borderWidth: 1, borderColor: preference === value ? theme.brandPrimary : theme.border, backgroundColor: preference === value ? theme.surfaceSelected : theme.surface }}>
        <ThemedText type="smallBold">{value[0].toUpperCase() + value.slice(1)}</ThemedText>
      </ActionSurface>)}
    </View>
    <ThemedText type="caption" accessibilityLiveRegion="polite">{saving ? 'Saving appearance…' : `Currently ${scheme}`}</ThemedText>
    {!!error && <FeedbackNotice kind="error" title="Appearance preference" message={error}
      onRetry={() => { void (failure === 'save' ? setPreference(preference) : hydrate()); }}
      retryLabel={failure === 'save' ? 'Retry saving appearance' : 'Retry restoring appearance'} busy={saving} />}
  </View>;
}
