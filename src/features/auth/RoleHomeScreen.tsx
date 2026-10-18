import { Link, router } from 'expo-router';
import { workspaceHref } from '@/features/navigation/navigation';
import { ScrollView, View } from 'react-native';

import { DashboardActionCard } from '@/components/DashboardActionCard';
import { DashboardWorkflowPanel } from '@/components/DashboardWorkflowPanel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Routes } from '@/constants/Routes';
import { authStyles } from '@/features/auth/Auth.styles';
import { useAuth } from '@/store';
import { StudentLearningPanel } from '@/features/exam/StudentLearningPanel';

type StaffSection = 'dashboard' | 'books' | 'chapters' | 'import' | 'question' | 'paper';
type MemberSection = 'dashboard' | 'exams' | 'history';

export function RoleHomeScreen() {
  const { user } = useAuth();
  const isStaff = user?.role === 'STAFF';

  return (
    <ThemedView style={authStyles.screenShell}>
      <ScrollView contentContainerStyle={authStyles.scrollContent}>
        <ThemedView style={authStyles.content}>
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
                : 'Choose an available exam or review your submitted results.'}
            </ThemedText>
            {user?.role === 'MEMBER' && (
              <ThemedText style={authStyles.info}>Member registration no longer requires email verification.</ThemedText>
            )}
            <Link href={Routes.profile}>
              <ThemedText type="linkPrimary">Open profile</ThemedText>
            </Link>
          </ThemedView>
          {isStaff ? <StaffQuickLinks userPermissions={user?.permissions || []} onOpen={(next) => router.navigate(workspaceHref(next))} /> : <MemberQuickLinks onOpen={(next) => router.navigate(next === 'history' ? '/results' : '/exams')} />}
          {user?.role === 'MEMBER' && <StudentLearningPanel key={user.id} />}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

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
        {userPermissions.includes('CONTENT_READ') && <DashboardActionCard title="Books" meta="Assigned book library" eyebrow="Library" accent="01" tone="green" onPress={() => onOpen('books')} />}
        {userPermissions.includes('CONTENT_MANAGE') && <DashboardActionCard title="Chapters" meta="Book-wise chapter setup" eyebrow="Structure" accent="02" tone="blue" onPress={() => onOpen('chapters')} />}
        {userPermissions.includes('QUESTION_MANAGE') && <DashboardActionCard title="CSV import" meta="Bulk question upload" eyebrow="Question bank" accent="Bulk" tone="amber" primary onPress={() => onOpen('import')} />}
        {userPermissions.includes('QUESTION_MANAGE') && <DashboardActionCard title="Questions" meta="Manual MCQ entry" eyebrow="Question bank" accent="MCQ" tone="blue" onPress={() => onOpen('question')} />}
        {userPermissions.includes('EXAM_MANAGE') && <DashboardActionCard title="Question papers" meta="Publish timed exams" eyebrow="Exam" accent="Live" tone="green" primary onPress={() => onOpen('paper')} />}
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
        body="Choose an open exam, save your answers and review your score. Explanations open after the exam closes and its final attempt time ends."
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
