import { useTheme, useThemeScheme } from '@/hooks/use-theme';
import { Redirect } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { Colors, type ThemePalette, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { AuthButton, AuthTextField } from '@/features/auth/components/AuthFields';
import { useAuthStyles } from '@/features/auth/Auth.styles';
import { useProfile } from './hooks/useProfile';
import { AppearanceSettings } from '@/features/appearance/AppearanceSettings';
import { AcademicProfileEditor } from './components/AcademicProfileEditor';
import { profileInitials, profilePermissions, profileRoleLabel, profileSections, profileStatusLabel } from './profile.helpers';

export function ProfileScreen() {
  const authStyles = useAuthStyles();
  const styles = useStyles();
  const C = useTheme();
 const vm = useProfile();
 const user = vm.user;
 if (vm.restoring) return <ActivityIndicator style={styles.loading} accessibilityLabel="Loading account" />;
 if (!user) return <Redirect href="/login" />;
 const permissions = profilePermissions(user);
 return <View style={styles.screen}>
  <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={vm.refreshing} onRefresh={vm.refresh} tintColor={C.brandPrimary} />}>
   <View style={styles.content}>
    <View style={styles.identity}>
     <View accessibilityLabel="Account initials" style={styles.avatar}><ThemedText style={styles.initials}>{profileInitials(user.name)}</ThemedText></View>
     <View style={styles.identityCopy}>
      <ThemedText style={styles.name}>{user.name}</ThemedText>
      <ThemedText type="small" selectable style={styles.muted}>{user.email}</ThemedText>
      <View style={styles.badges}>
       <ThemedText type="caption" style={styles.role}>{profileRoleLabel[user.role]}</ThemedText>
       <ThemedText type="caption" style={[styles.status, user.accountStatus !== 'active' && styles.pending]}>{profileStatusLabel[user.accountStatus]}</ThemedText>
      </View>
     </View>
     <Pressable accessibilityRole="button" accessibilityLabel="Refresh profile" accessibilityState={{ disabled: vm.refreshing || vm.busy }} disabled={vm.refreshing || vm.busy} onPress={vm.refresh} style={styles.refresh}>
      {vm.refreshing ? <ActivityIndicator size="small" color={C.brandPrimary} /> : <SymbolView name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }} tintColor={C.brandPrimary} size={22} />}
     </Pressable>
    </View>
    {vm.error && <View style={styles.errorBox}><ThemedText accessibilityRole="alert" style={styles.errorText}>{vm.error}</ThemedText><AuthButton label="Retry profile refresh" onPress={vm.refresh} disabled={vm.refreshing} variant="secondary" /></View>}
    {user.forcePasswordChange && <ThemedText accessibilityRole="alert" style={styles.warning}>Update your temporary password to keep your account secure.</ThemedText>}
    {profileSections(user).map((section) => <View key={section.title} style={styles.section}>
     <ThemedText type="smallBold" style={styles.sectionTitle}>{section.title}</ThemedText>
     <View style={styles.list}>{section.rows.map((row, index) => <View key={row.label} style={[styles.row, index > 0 && styles.divider]}>
      <ThemedText type="caption" style={styles.muted}>{row.label}</ThemedText>
      <ThemedText selectable style={styles.value}>{row.value}</ThemedText>
     </View>)}</View>
    </View>)}
    {user.role !== 'MEMBER' && <View style={styles.section}>
     <ThemedText type="smallBold" style={styles.sectionTitle}>Your access</ThemedText>
     <View style={styles.list}>
      <View style={styles.row}><ThemedText type="smallBold">{user.role === 'ADMIN' ? 'Administrator access' : 'Assigned permissions'}</ThemedText>
       <ThemedText type="small" style={styles.muted}>{user.role === 'ADMIN' ? 'Manage staff access, academic content and question papers across ExamQuest.' : 'Your administrator controls these permissions and your book access.'}</ThemedText>
      </View>
      {user.role === 'STAFF' && <>
       {permissions.map((permission) => <View key={permission.key} style={[styles.permission, styles.divider]}>
        <SymbolView name={{ ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' }} size={20} tintColor={C.brandPrimary} />
        <View style={styles.permissionCopy}><ThemedText type="smallBold">{permission.label}</ThemedText><ThemedText type="caption" style={styles.muted}>{permission.description}</ThemedText></View>
       </View>)}
       {!permissions.length && <ThemedText style={styles.row}>No tools assigned yet. Contact your administrator for access.</ThemedText>}
       <View style={[styles.row, styles.divider]}><ThemedText type="caption" style={styles.muted}>Assigned books</ThemedText><ThemedText>{new Set(user.bookIds || []).size} books</ThemedText><ThemedText type="caption" style={styles.muted}>Book access and the permissions above both apply.</ThemedText></View>
      </>}
     </View>
    </View>}
    {user.role === 'MEMBER' && <AcademicProfileEditor key={user.id} user={user} disabled={vm.busy || vm.refreshing} />}
    <AppearanceSettings />
    <View style={styles.section}>
     <ThemedText type="smallBold" style={styles.sectionTitle}>Security & sessions</ThemedText>
     <View style={styles.list}>
      <AccountAction label="Change password" description="Update your password securely" disabled={vm.busy} onPress={() => vm.open('password')} />
      <AccountAction label="Logout this device" description="End your session on this device" disabled={vm.busy} onPress={() => vm.action('logout')} danger />
      <AccountAction label="Logout all devices" description="End every active session, including this one" disabled={vm.busy} onPress={() => vm.open('logoutAll')} danger />
     </View>
     {vm.busy && !vm.dialog && <ActivityIndicator accessibilityLabel="Signing out" />}
     <ThemedText type="caption" style={styles.muted}>Your role and access are managed by Admin. Members can update academic details above.</ThemedText>
    </View>
   </View>
  </ScrollView>
  <Modal visible={!!vm.dialog} transparent animationType="fade" onRequestClose={vm.close}>
   <KeyboardAvoidingView style={styles.modalScreen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <SafeAreaView style={styles.modalSafe}>
     <View style={styles.dialog} accessibilityViewIsModal>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.dialogContent}>
       <ThemedText type="sectionTitle">{vm.dialog === 'password' ? 'Change password' : 'Logout all devices?'}</ThemedText>
       <ThemedText type="small" style={styles.muted}>{vm.dialog === 'password' ? 'After updating your password, you will need to sign in again on every device.' : 'You and any other devices using your account will need to sign in again.'}</ThemedText>
       {vm.dialog === 'password' && <>
        <AuthTextField label="Current password" placeholder="Enter current password" value={vm.passwords.current} onChangeText={(current) => vm.setPasswords((value) => ({ ...value, current }))} secureTextEntry showPasswordToggle editable={!vm.busy} textContentType="password" autoComplete="current-password" maxLength={128} />
        <AuthTextField label="New password" placeholder="At least 10 characters" value={vm.passwords.next} onChangeText={(next) => vm.setPasswords((value) => ({ ...value, next }))} secureTextEntry showPasswordToggle editable={!vm.busy} textContentType="newPassword" autoComplete="new-password" maxLength={128} helperText="Use 10–128 characters. Choose a password you do not use elsewhere." />
        <AuthTextField label="Confirm new password" placeholder="Re-enter new password" value={vm.passwords.confirm} onChangeText={(confirm) => vm.setPasswords((value) => ({ ...value, confirm }))} secureTextEntry showPasswordToggle editable={!vm.busy} textContentType="newPassword" autoComplete="new-password" maxLength={128} />
       </>}
       {vm.securityError && <ThemedText accessibilityRole="alert" style={authStyles.error}>{vm.securityError}</ThemedText>}
       <AuthButton label={vm.busy ? 'Working...' : vm.dialog === 'password' ? 'Update password' : 'Logout all devices'} disabled={vm.busy} onPress={() => vm.action(vm.dialog === 'password' ? 'password' : 'logoutAll')} variant={vm.dialog === 'logoutAll' ? 'danger' : 'primary'} />
       <AuthButton label="Cancel" disabled={vm.busy} onPress={vm.close} variant="secondary" />
      </ScrollView>
     </View>
    </SafeAreaView>
   </KeyboardAvoidingView>
  </Modal>
 </View>;
}
function AccountAction({ label, description, disabled, onPress, danger }: { label: string; description: string; disabled: boolean; onPress: () => void; danger?: boolean }) {
  const styles = useStyles();
  const C = useTheme();
 return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.action, styles.divider, pressed && styles.pressed, disabled && styles.disabled]}>
  <View style={styles.permissionCopy}><ThemedText type="smallBold" style={danger && { color: C.error }}>{label}</ThemedText><ThemedText type="caption" style={styles.muted}>{description}</ThemedText></View>
  <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={20} tintColor={C.textMuted} />
 </Pressable>;
}
function createStyles(C: ThemePalette) { return StyleSheet.create({
 screen: { flex: 1, backgroundColor: C.background }, loading: { flex: 1 },
 scroll: { flexGrow: 1, alignItems: 'center', padding: Spacing.three, paddingBottom: Spacing.four },
 content: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.four },
 identity: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.twoHalf, paddingVertical: Spacing.twoHalf },
 avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: C.surfaceSelected },
 initials: { color: C.brandPrimary, fontSize: 21, fontWeight: '700' },
 identityCopy: { flex: 1, minWidth: 0, gap: Spacing.one },
 name: { fontSize: 22, lineHeight: 30, fontWeight: '700', color: C.textPrimary },
 muted: { color: C.textSecondary }, badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
 role: { color: C.brandPrimary, fontWeight: '700' }, status: { color: C.success, fontWeight: '600' }, pending: { color: C.warning },
 refresh: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
 section: { gap: Spacing.twoHalf }, sectionTitle: { color: C.textSecondary, paddingHorizontal: Spacing.one },
 list: { backgroundColor: C.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
 row: { padding: Spacing.three, gap: Spacing.one }, divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
 value: { color: C.textPrimary }, permission: { flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.three, gap: Spacing.twoHalf }, permissionCopy: { flex: 1, minWidth: 0, gap: Spacing.one },
 action: { minHeight: 72, padding: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, pressed: { backgroundColor: C.surfaceSoft }, disabled: { opacity: 0.5 },
 errorBox: { padding: Spacing.three, gap: Spacing.two, borderRadius: Radius.md, backgroundColor: C.errorSoft }, errorText: { color: C.error }, warning: { padding: Spacing.three, color: C.warning, backgroundColor: C.warningSoft, borderRadius: Radius.md },
 modalScreen: { flex: 1, backgroundColor: C.scrim }, modalSafe: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.three },
 dialog: { width: '100%', maxWidth: 440, maxHeight: '100%', borderRadius: Radius.lg, backgroundColor: C.surface, overflow: 'hidden' }, dialogContent: { padding: Spacing.four, gap: Spacing.three },
}); }
const stylesByScheme = { light: createStyles(Colors.light), dark: createStyles(Colors.dark) };
function useStyles() { return stylesByScheme[useThemeScheme()]; }
