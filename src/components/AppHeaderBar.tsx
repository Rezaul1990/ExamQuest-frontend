import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ExamQuestColors, Spacing } from '@/constants/theme';
import { useAuth } from '@/store';
type Props = { title: string; canGoBack?: boolean; onBack?: () => void; onProfile?: () => void; hideMenu?: boolean };
export function AppHeaderBar({ title, canGoBack, onBack, onProfile, hideMenu }: Props) {
 const insets = useSafeAreaInsets();
 const { user, logout } = useAuth();
 const [menuOpen, setMenuOpen] = useState(false);
 return <View style={{ backgroundColor: ExamQuestColors.surface, paddingTop: insets.top }}>
  <View style={styles.header}>
   {canGoBack ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.action}><SymbolView name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }} size={22} tintColor={ExamQuestColors.textPrimary} /></Pressable> : <View style={styles.brand}><ThemedText style={styles.brandText}>EQ</ThemedText></View>}
   <ThemedText accessibilityRole="header" type="smallBold" style={styles.title} numberOfLines={1}>{title}</ThemedText>
   {user && !hideMenu ? <Pressable accessibilityRole="button" accessibilityLabel="Open account menu" accessibilityState={{ expanded: menuOpen }} onPress={() => setMenuOpen(true)} style={styles.action}><SymbolView name={{ ios: 'ellipsis', android: 'more_vert', web: 'more_vert' }} size={24} tintColor={ExamQuestColors.textPrimary} /></Pressable> : <View style={styles.action} />}
  </View>
  <Modal visible={!!user && menuOpen && !hideMenu} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
   <Pressable accessibilityRole="button" accessibilityLabel="Close account menu" style={styles.scrim} onPress={() => setMenuOpen(false)}>
    <View accessibilityViewIsModal style={[styles.menu, { marginTop: insets.top + 56 }]}>
     <ThemedText type="smallBold">{user?.name}</ThemedText>
     <ThemedText type="caption">{user?.role}</ThemedText>
     {onProfile && <Pressable accessibilityRole="button" accessibilityLabel="Open profile" style={styles.menuItem} onPress={() => { setMenuOpen(false); onProfile(); }}><ThemedText>Profile</ThemedText></Pressable>}
     <Pressable accessibilityRole="button" accessibilityLabel="Logout" style={styles.menuItem} onPress={() => { setMenuOpen(false); void logout().catch(() => {}); }}><ThemedText style={{ color: ExamQuestColors.error }}>Logout</ThemedText></Pressable>
    </View>
   </Pressable>
  </Modal>
 </View>;
}
const styles = StyleSheet.create({
 header: { height: 56, paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ExamQuestColors.border },
 title: { flex: 1, color: ExamQuestColors.textPrimary },
 action: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
 brand: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: ExamQuestColors.brandPrimary },
 brandText: { color: ExamQuestColors.onBrandPrimary, fontWeight: '800' },
 scrim: { flex: 1, backgroundColor: 'rgba(15,23,42,0.25)', alignItems: 'flex-end' },
 menu: { marginRight: Spacing.three, width: 220, padding: Spacing.three, gap: Spacing.one, backgroundColor: ExamQuestColors.surface, borderRadius: 8, borderWidth: 1, borderColor: ExamQuestColors.border },
 menuItem: { minHeight: 48, justifyContent: 'center', paddingHorizontal: Spacing.two },
});
