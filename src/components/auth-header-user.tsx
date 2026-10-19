import { useThemeScheme } from '@/hooks/use-theme';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, type ThemePalette, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/store';

const roleLabels = {
  ADMIN: 'Admin',
  STAFF: 'Staff',
  MEMBER: 'Member',
} as const;

export function AuthHeaderUser() {
  const styles = useStyles();
  const user = useAuth((state) => state.user);

  if (!user) return null;

  return (
    <View accessibilityLabel={`Logged in as ${user.name}, ${roleLabels[user.role]}`} style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user.name.trim().slice(0, 1).toUpperCase() || 'U'}</Text>
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.name}>
          {user.name}
        </Text>
        <Text numberOfLines={1} style={styles.role}>
          {roleLabels[user.role]}
        </Text>
      </View>
    </View>
  );
}

function createStyles(ExamQuestColors: ThemePalette) { return StyleSheet.create({
  container: {
    maxWidth: 168,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: ExamQuestColors.border,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    backgroundColor: ExamQuestColors.surfaceSoft,
  },
  avatar: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    backgroundColor: ExamQuestColors.brandPrimary,
  },
  avatarText: {
    color: ExamQuestColors.onBrandPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  copy: {
    flex: 1,
  },
  name: {
    color: ExamQuestColors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  role: {
    color: ExamQuestColors.brandPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
}); }
const stylesByScheme = { light: createStyles(Colors.light), dark: createStyles(Colors.dark) };
function useStyles() { return stylesByScheme[useThemeScheme()]; }
