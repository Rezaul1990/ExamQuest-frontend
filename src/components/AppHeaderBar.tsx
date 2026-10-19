import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Keyboard, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ActionSurface } from '@/components/ui/ActionSurface';
import { ControlSize, Elevation, Radius, Spacing, type ThemePalette } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/store';
type Props = { title: string; canGoBack?: boolean; onBack?: () => void; onProfile?: () => void; hideMenu?: boolean };
export function AppHeaderBar({ title, canGoBack, onBack, onProfile, hideMenu }: Props) {
 const theme = useTheme();
 const styles = useMemo(() => createStyles(theme), [theme]);
 const insets = useSafeAreaInsets();
 const { user, logout } = useAuth();
 const [menuOpen, setMenuOpen] = useState(false);
 const closeMenu = () => setMenuOpen(false);
 return <View style={{ backgroundColor: theme.surface, paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }}>
  <View style={styles.header}>
   {canGoBack && onBack ? <ActionSurface accessibilityLabel="Go back" onPress={() => { Keyboard.dismiss(); closeMenu(); onBack(); }} style={styles.action}><SymbolView name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }} size={ControlSize.icon} tintColor={theme.textPrimary} /></ActionSurface> : <View style={styles.brand}><ThemedText style={styles.brandText}>EQ</ThemedText></View>}
   <ThemedText accessibilityRole="header" type="smallBold" style={styles.title} numberOfLines={1}>{title}</ThemedText>
   {user && !hideMenu ? <ActionSurface accessibilityLabel="Open account menu" accessibilityState={{ expanded: menuOpen }} onPress={() => { Keyboard.dismiss(); setMenuOpen(true); }} style={styles.action}><SymbolView name={{ ios: 'ellipsis', android: 'more_vert', web: 'more_vert' }} size={24} tintColor={theme.textPrimary} /></ActionSurface> : <View style={styles.action} />}
  </View>
  <Modal visible={!!user && menuOpen && !hideMenu} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
   <Pressable accessibilityRole="button" accessibilityLabel="Close account menu" style={styles.scrim} onPress={() => setMenuOpen(false)}>
    <View accessibilityViewIsModal style={[styles.menu, { marginTop: insets.top + ControlSize.header, marginRight: insets.right + Spacing.three }]}>
     <ThemedText type="smallBold">{user?.name}</ThemedText>
     <ThemedText type="caption">{user?.role}</ThemedText>
     {onProfile && <ActionSurface accessibilityLabel="Open profile" style={styles.menuItem} onPress={() => { Keyboard.dismiss(); closeMenu(); onProfile(); }}><ThemedText>Profile</ThemedText></ActionSurface>}
     <ActionSurface accessibilityLabel="Logout" style={styles.menuItem} onPress={() => { Keyboard.dismiss(); closeMenu(); void logout().catch(() => {}); }}><ThemedText style={{ color: theme.error }}>Logout</ThemedText></ActionSurface>
    </View>
   </Pressable>
  </Modal>
 </View>;
}
const createStyles = (theme: ThemePalette) => StyleSheet.create({
 header: { height: ControlSize.header, paddingHorizontal: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
 title: { flex: 1, color: theme.textPrimary },
 action: { width: ControlSize.touch, height: ControlSize.touch, alignItems: 'center', justifyContent: 'center' },
 brand: { minWidth: 36, minHeight: 36, padding: Spacing.half, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.brandPrimary },
 brandText: { color: theme.onBrandPrimary, fontWeight: '800' },
 scrim: { flex: 1, backgroundColor: theme.scrim, alignItems: 'flex-end' },
 menu: { ...Elevation.floating, marginRight: Spacing.three, width: 220, padding: Spacing.three, gap: Spacing.one, backgroundColor: theme.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: theme.border },
 menuItem: { minHeight: ControlSize.input, justifyContent: 'center', paddingHorizontal: Spacing.two },
});
