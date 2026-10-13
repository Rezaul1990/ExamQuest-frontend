import { router } from 'expo-router';
import { ActivityIndicator, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Routes } from '@/constants/Routes';
import { authStyles } from '@/features/auth/Auth.styles';
import { AuthButton, AuthHero, ScreenStat } from '@/features/auth/components/AuthFields';
import { useAuth } from '@/store';

export function ProfileScreen() {
  const { user, restoring, logout, logoutAll } = useAuth();

  if (restoring) {
    return <ActivityIndicator />;
  }

  if (!user) {
    router.replace(Routes.login);
    return null;
  }

  return (
    <ThemedView style={authStyles.screenShell}>
      <ScrollView contentContainerStyle={authStyles.scrollContent}>
        <ThemedView style={authStyles.content}>
          <ThemedView style={authStyles.headerBand}>
            <AuthHero
              kicker="Account"
              title="Profile"
              body="Review your account details and manage active sessions."
              badges={['Session control', 'Account status']}
              preview="account"
            />
          </ThemedView>
          <ThemedView style={authStyles.panel}>
            <ThemedView style={authStyles.statGrid}>
              <ScreenStat label="Role" value={user.role} />
              <ScreenStat label="Status" value={user.accountStatus} />
            </ThemedView>
            <ThemedView style={authStyles.listRow}>
              <ThemedText type="caption" style={authStyles.mutedText}>Name</ThemedText>
              <ThemedText>{user.name}</ThemedText>
            </ThemedView>
            <ThemedView style={[authStyles.listRow, authStyles.listRowLast]}>
              <ThemedText type="caption" style={authStyles.mutedText}>Email</ThemedText>
              <ThemedText>{user.email}</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ScrollView>
      <ThemedView style={authStyles.fixedFooter}>
        <ThemedView style={authStyles.footerInner}>
          <AuthButton label="Logout this device" onPress={logout} variant="secondary" />
          <AuthButton label="Logout all devices" onPress={logoutAll} variant="danger" />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
