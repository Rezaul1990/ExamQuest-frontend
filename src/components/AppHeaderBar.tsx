import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ExamQuestColors, Radius, Spacing } from '@/constants/theme';

type AppHeaderBarProps = {
  title: string;
  subtitle?: string;
  kicker?: string;
  variant?: 'dashboard' | 'inner' | 'route';
  canGoBack?: boolean;
  onBack?: () => void;
  menuLabel?: string;
};

export function AppHeaderBar({
  title,
  subtitle,
  kicker,
  variant = 'route',
  canGoBack,
  onBack,
  menuLabel = 'Open menu',
}: AppHeaderBarProps) {
  const isInner = variant === 'inner' || (variant === 'route' && canGoBack);
  const insets = useSafeAreaInsets();
  const topInset = variant === 'route' ? insets.top : 0;

  return (
    <View
      style={[
        styles.header,
        variant === 'route' && { paddingTop: topInset + Spacing.two, minHeight: 58 + topInset },
        variant === 'dashboard' && styles.dashboardHeader,
        isInner && styles.innerHeader,
      ]}>
      <View style={styles.leftCluster}>
        {isInner && (
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.backButton}>
            <ThemedText style={styles.backIcon}>‹</ThemedText>
          </Pressable>
        )}
        {!isInner && (
          <View style={styles.brandMark}>
            <ThemedText style={styles.brandMarkText}>EQ</ThemedText>
          </View>
        )}
        <View style={styles.titleBlock}>
          {!!kicker && <ThemedText type="caption" style={styles.kicker}>{kicker}</ThemedText>}
          <ThemedText type="smallBold" style={[styles.title, variant === 'dashboard' && styles.dashboardTitle]} numberOfLines={1}>
            {title}
          </ThemedText>
          {!!subtitle && <ThemedText type="caption" style={styles.subtitle} numberOfLines={1}>{subtitle}</ThemedText>}
        </View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={menuLabel} style={styles.menuButton}>
        <View style={styles.menuDot} />
        <View style={styles.menuDot} />
        <View style={styles.menuDot} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomLeftRadius: Radius.sm,
    borderBottomRightRadius: Radius.sm,
    backgroundColor: '#135083',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
  dashboardHeader: {
    minHeight: 76,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#2B6B9E',
    paddingVertical: Spacing.twoHalf,
  },
  innerHeader: {
    minHeight: 52,
    borderBottomLeftRadius: Radius.sm,
    borderBottomRightRadius: Radius.sm,
    paddingVertical: Spacing.one,
  },
  leftCluster: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    marginTop: -2,
    color: ExamQuestColors.onBrandPrimary,
    fontSize: 34,
    fontWeight: '700',
  },
  brandMark: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  brandMarkText: {
    color: ExamQuestColors.onBrandPrimary,
    fontWeight: '900',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  kicker: {
    color: '#B8D7EF',
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: ExamQuestColors.onBrandPrimary,
  },
  dashboardTitle: {
    fontSize: 17,
  },
  subtitle: {
    color: '#D7E8F7',
  },
  menuButton: {
    width: 32,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  menuDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: ExamQuestColors.onBrandPrimary,
  },
});
