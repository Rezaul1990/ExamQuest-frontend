import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Routes } from '@/constants/Routes';
import { authStyles } from '@/features/auth/Auth.styles';
import { AuthButton, AuthHero, ScreenStat } from '@/features/auth/components/AuthFields';
import { ExamAdminPanel } from '@/features/exam/ExamAdminPanel';
import { MemberExamWorkspace } from '@/features/exam/MemberExamWorkspace';
import { useAuth } from '@/store';

type StaffSection = 'dashboard' | 'books' | 'chapters' | 'import' | 'question' | 'paper';
type MemberSection = 'dashboard' | 'exams' | 'history';

export function RoleHomeScreen() {
  const { user, logout } = useAuth();
  const [staffSection, setStaffSection] = useState<StaffSection>('dashboard');
  const [memberSection, setMemberSection] = useState<MemberSection>('dashboard');
  const isStaff = user?.role === 'STAFF';
  const activeTitle = isStaff
    ? staffSection === 'dashboard' ? 'Staff Workspace' : staffSectionTitles[staffSection]
    : memberSection === 'dashboard' ? 'Student Workspace' : memberSectionTitles[memberSection];

  return (
    <ThemedView style={authStyles.screenShell}>
      <ScrollView contentContainerStyle={authStyles.scrollContent}>
        <ThemedView style={authStyles.content}>
          <ThemedView style={authStyles.headerBand}>
            <AuthHero
              kicker={isStaff ? 'Operations' : 'Learning'}
              title={activeTitle}
              body={`Signed in as ${user?.name || 'ExamQuest user'}`}
              badges={isStaff ? ['Assigned access', 'Operational workspace'] : ['Member account', 'Exam ready']}
              preview={isStaff ? 'access' : 'exam'}>
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
          {isStaff ? (
            staffSection === 'dashboard' ? <StaffQuickLinks userPermissions={user?.permissions || []} onOpen={setStaffSection} /> : <ExamAdminPanel section={staffSection} onBack={() => setStaffSection('dashboard')} />
          ) : (
            memberSection === 'dashboard' ? <MemberQuickLinks onOpen={setMemberSection} /> : <MemberExamWorkspace section={memberSection} onBack={() => setMemberSection('dashboard')} />
          )}
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

const staffSectionTitles: Record<StaffSection, string> = {
  dashboard: 'Staff Workspace',
  books: 'Books',
  chapters: 'Chapters',
  import: 'CSV Import',
  question: 'Create Question',
  paper: 'Question Papers',
};

const memberSectionTitles: Record<MemberSection, string> = {
  dashboard: 'Student Workspace',
  exams: 'Available Exams',
  history: 'Result History',
};

function StaffQuickLinks({ userPermissions, onOpen }: { userPermissions: string[]; onOpen: (section: StaffSection) => void }) {
  return (
    <ThemedView style={authStyles.panel}>
      <ThemedView style={authStyles.panelHeader}>
        <ThemedText type="sectionTitle">Quick links</ThemedText>
        <ThemedText type="small" style={authStyles.mutedText}>Open only the staff task you need right now.</ThemedText>
      </ThemedView>
      <ThemedText type="caption" style={authStyles.mutedText}>Permissions: {userPermissions.join(', ') || 'None assigned'}</ThemedText>
      <View style={authStyles.dashboardGrid}>
        <DashboardCard title="Books" meta="Create and review books" onPress={() => onOpen('books')} />
        <DashboardCard title="Chapters" meta="Book-wise chapter setup" onPress={() => onOpen('chapters')} />
        <DashboardCard title="CSV import" meta="Bulk question upload" primary onPress={() => onOpen('import')} />
        <DashboardCard title="Questions" meta="Manual MCQ entry" onPress={() => onOpen('question')} />
        <DashboardCard title="Question papers" meta="Publish timed exams" primary onPress={() => onOpen('paper')} />
      </View>
    </ThemedView>
  );
}

function MemberQuickLinks({ onOpen }: { onOpen: (section: MemberSection) => void }) {
  return (
    <ThemedView style={authStyles.panel}>
      <ThemedView style={authStyles.panelHeader}>
        <ThemedText type="sectionTitle">Quick links</ThemedText>
        <ThemedText type="small" style={authStyles.mutedText}>Go straight to exams or review your previous results.</ThemedText>
      </ThemedView>
      <View style={authStyles.dashboardGrid}>
        <DashboardCard title="Available exams" meta="Book, chapter and paper list" primary onPress={() => onOpen('exams')} />
        <DashboardCard title="Result history" meta="Submitted attempts and scores" onPress={() => onOpen('history')} />
      </View>
    </ThemedView>
  );
}

function DashboardCard({ title, meta, primary, onPress }: { title: string; meta: string; primary?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[authStyles.dashboardCard, primary && authStyles.dashboardCardPrimary]}>
      <ThemedText type="smallBold" style={authStyles.dashboardCardTitle}>{title}</ThemedText>
      <ThemedText type="caption" style={authStyles.dashboardCardMeta}>{meta}</ThemedText>
    </Pressable>
  );
}
