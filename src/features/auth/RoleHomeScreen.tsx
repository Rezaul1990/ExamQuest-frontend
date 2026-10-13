import { Link } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Routes } from '@/constants/Routes';
import { authStyles } from '@/features/auth/Auth.styles';
import { AuthButton, AuthHero, ScreenStat } from '@/features/auth/components/AuthFields';
import { ExamAdminPanel } from '@/features/exam/ExamAdminPanel';
import { MemberExamWorkspace } from '@/features/exam/MemberExamWorkspace';
import { useAuth } from '@/store';

export function RoleHomeScreen() {
  const { user, logout } = useAuth();

  return (
    <ThemedView style={authStyles.screenShell}>
      <ScrollView contentContainerStyle={authStyles.scrollContent}>
        <ThemedView style={authStyles.content}>
          <ThemedView style={authStyles.headerBand}>
            <AuthHero
              kicker={user?.role === 'STAFF' ? 'Operations' : 'Learning'}
              title={user?.role === 'STAFF' ? 'Staff Workspace' : 'Student Workspace'}
              body={`Signed in as ${user?.name || 'ExamQuest user'}`}
              badges={user?.role === 'STAFF' ? ['Assigned access', 'Operational workspace'] : ['Member account', 'Exam ready']}
              preview={user?.role === 'STAFF' ? 'access' : 'exam'}>
              <View style={authStyles.statGrid}>
                <ScreenStat label="Role" value={user?.role || 'Member'} />
                <ScreenStat label="Status" value={user?.accountStatus || 'Active'} />
              </View>
            </AuthHero>
          </ThemedView>
          <ThemedView style={authStyles.panel}>
            <ThemedView style={authStyles.panelHeader}>
              <ThemedText type="sectionTitle">Access summary</ThemedText>
              <ThemedText type="small" style={authStyles.mutedText}>
                {user?.role === 'STAFF'
                  ? 'Your staff tools depend on the permissions assigned by Admin.'
                  : 'Your member account is ready for study and exam modules.'}
              </ThemedText>
            </ThemedView>
            <ThemedText>
              {user?.role === 'STAFF'
                ? `Permissions: ${(user.permissions || []).join(', ') || 'None assigned'}`
                : 'Study, question paper and exam areas will appear here as modules are added.'}
            </ThemedText>
            {user?.role === 'MEMBER' && (
              <ThemedText style={authStyles.info}>Member registration no longer requires email verification.</ThemedText>
            )}
            <Link href={Routes.profile}>
              <ThemedText type="linkPrimary">Open profile</ThemedText>
            </Link>
          </ThemedView>
          {user?.role === 'STAFF' ? <ExamAdminPanel /> : <MemberExamWorkspace />}
        </ThemedView>
      </ScrollView>
      <ThemedView style={authStyles.fixedFooter}>
        <ThemedView style={authStyles.footerInner}>
          <AuthButton label="Back to login" onPress={logout} variant="secondary" />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
