import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { authStyles } from '@/features/auth/Auth.styles';

type DashboardActionCardProps = {
  title: string;
  meta: string;
  eyebrow?: string;
  accent?: string;
  tone?: 'green' | 'blue' | 'amber' | 'slate';
  primary?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function DashboardActionCard({
  title,
  meta,
  eyebrow,
  accent,
  tone = 'green',
  primary,
  disabled,
  onPress,
}: DashboardActionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        authStyles.dashboardCard,
        primary && authStyles.dashboardCardPrimary,
        disabled && authStyles.dashboardCardDisabled,
        pressed && !disabled && authStyles.dashboardCardPressed,
      ]}>
      <View
        style={[
          authStyles.dashboardCardRail,
          tone === 'blue' && authStyles.dashboardCardRailBlue,
          tone === 'amber' && authStyles.dashboardCardRailAmber,
          tone === 'slate' && authStyles.dashboardCardRailSlate,
        ]}
      />
      <View style={authStyles.dashboardCardTopRow}>
        {!!eyebrow && <ThemedText type="caption" style={authStyles.dashboardCardEyebrow}>{eyebrow}</ThemedText>}
        {!!accent && (
          <View style={[authStyles.dashboardCardAccent, primary && authStyles.dashboardCardAccentPrimary]}>
            <ThemedText type="caption" style={authStyles.dashboardCardAccentText}>{accent}</ThemedText>
          </View>
        )}
      </View>
      <View style={authStyles.dashboardCardCopy}>
        <ThemedText type="smallBold" style={authStyles.dashboardCardTitle}>{title}</ThemedText>
        <ThemedText type="caption" style={authStyles.dashboardCardMeta}>{meta}</ThemedText>
      </View>
      <ThemedText type="caption" style={authStyles.dashboardCardCta}>Open</ThemedText>
    </Pressable>
  );
}
