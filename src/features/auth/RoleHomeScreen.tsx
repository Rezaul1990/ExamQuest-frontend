import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { AppHeaderBar } from '@/components/AppHeaderBar';
import { DashboardActionCard } from '@/components/DashboardActionCard';
import { DashboardWorkflowPanel } from '@/components/DashboardWorkflowPanel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Routes } from '@/constants/Routes';
import { authStyles } from '@/features/auth/Auth.styles';
import { AuthButton } from '@/features/auth/components/AuthFields';
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
            <AppHeaderBar
              kicker={isStaff ? 'Operations' : 'Learning'}
              title={activeTitle}
              subtitle={`${user?.name || 'ExamQuest user'} · ${user?.role || 'Member'} · ${user?.accountStatus || 'Active'}`}
              variant={(isStaff ? staffSection : memberSection) === 'dashboard' ? 'dashboard' : 'inner'}
              canGoBack={(isStaff ? staffSection : memberSection) !== 'dashboard'}
              onBack={() => (isStaff ? setStaffSection('dashboard') : setMemberSection('dashboard'))}
            />
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
            staffSection === 'dashboard' ? <StaffQuickLinks userPermissions={user?.permissions || []} onOpen={setStaffSection} /> : <ExamAdminPanel section={staffSection} onBack={() => setStaffSection('dashboard')} onOpenSection={setStaffSection} />
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
      <DashboardWorkflowPanel
        title="Prepare content without leaving your flow"
        body="Follow the same operational rhythm every time: organize, upload, then publish."
        badge="Staff path"
        progress={72}
        steps={[
          { label: 'Book/chapter' },
          { label: 'Question bank' },
          { label: 'Question paper' },
        ]}
      />
      <View style={authStyles.dashboardGrid}>
        <DashboardActionCard title="Books" meta="Create and review books" eyebrow="Library" accent="01" tone="green" onPress={() => onOpen('books')} />
        <DashboardActionCard title="Chapters" meta="Book-wise chapter setup" eyebrow="Structure" accent="02" tone="blue" onPress={() => onOpen('chapters')} />
        <DashboardActionCard title="CSV import" meta="Bulk question upload" eyebrow="Question bank" accent="Bulk" tone="amber" primary onPress={() => onOpen('import')} />
        <DashboardActionCard title="Questions" meta="Manual MCQ entry" eyebrow="Question bank" accent="MCQ" tone="blue" onPress={() => onOpen('question')} />
        <DashboardActionCard title="Question papers" meta="Publish timed exams" eyebrow="Exam" accent="Live" tone="green" primary onPress={() => onOpen('paper')} />
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
      <DashboardWorkflowPanel
        title="Your exam path"
        body="Pick a book, start an open paper, then review the score and explanations after submission."
        badge="Student path"
        progress={38}
        steps={[
          { label: 'Choose book' },
          { label: 'Answer MCQ' },
          { label: 'Review result' },
        ]}
      />
      <View style={authStyles.dashboardGrid}>
        <DashboardActionCard title="Available exams" meta="Book, chapter and paper list" eyebrow="Start" accent="Live" tone="green" primary onPress={() => onOpen('exams')} />
        <DashboardActionCard title="Result history" meta="Submitted attempts and scores" eyebrow="Review" accent="Score" tone="blue" onPress={() => onOpen('history')} />
      </View>
    </ThemedView>
  );
}
