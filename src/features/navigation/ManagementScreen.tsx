import { Redirect, router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { DashboardActionCard } from '@/components/DashboardActionCard';
import { ThemedText } from '@/components/themed-text';
import { authStyles } from '@/features/auth/Auth.styles';
import { ExamAdminPanel } from '@/features/exam/ExamAdminPanel';
import { useAuth } from '@/store';
import { canManageSection, managementSections, workspaceHref, type WorkspaceSection } from './navigation';

export function ManagementScreen({ section }: { section?: string }) {
  const user = useAuth((state) => state.user);
  if (section && !canManageSection(user, section) && !(section === 'paper' && (user?.role === 'ADMIN' || (user?.role === 'STAFF' && user.permissions?.includes('EXAM_MANAGE'))))) return <Redirect href="/" />;
  return <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
    <View style={authStyles.content}>
      {section ? <ExamAdminPanel section={section as 'books' | 'chapters' | 'import' | 'question' | 'paper'} onOpenSection={(next) => router.navigate(workspaceHref(next as WorkspaceSection))} /> : <>
        <ThemedText>Open the content tools available to your account.</ThemedText>
        <View style={authStyles.dashboardGrid}>{Object.entries(managementSections).filter(([key]) => canManageSection(user, key)).map(([key, config]) =>
          <DashboardActionCard key={key} title={config.title} meta="Manage exam content" eyebrow="Workspace" accent="Open" tone="green" onPress={() => router.push(workspaceHref(key as WorkspaceSection))} />
        )}</View>
      </>}
    </View>
  </ScrollView>;
}
