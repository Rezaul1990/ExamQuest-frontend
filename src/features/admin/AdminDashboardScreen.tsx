import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { AppHeaderBar } from '@/components/AppHeaderBar';
import { DashboardActionCard } from '@/components/DashboardActionCard';
import { DashboardWorkflowPanel } from '@/components/DashboardWorkflowPanel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { staffPermissions } from '@/constants/Permissions';
import { authStyles } from '@/features/auth/Auth.styles';
import { AuthButton, AuthTextField } from '@/features/auth/components/AuthFields';
import { ExamAdminPanel } from '@/features/exam/ExamAdminPanel';
import { getApiErrorMessage } from '@/services/apiClient';
import { adminService } from '@/services/adminService';
import { useAuth } from '@/store';

type AdminSection = 'dashboard' | 'staff' | 'books' | 'chapters' | 'import' | 'question' | 'paper';

export function AdminDashboardScreen() {
  const { logout } = useAuth();
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [selected, setSelected] = useState<string[]>(['CONTENT_READ']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [staffCount, setStaffCount] = useState<number | null>(null);

  useEffect(() => {
    adminService
      .listUsers()
      .then((result) => setStaffCount(result.users.filter((user) => user.role === 'STAFF').length))
      .catch(() => setStaffCount(null));
  }, [message]);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggle(permission: string) {
    setSelected((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]
    );
  }

  async function submit() {
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Fill in staff name, email and temporary password.');
      return;
    }
    if (!selected.length) {
      setError('Select at least one permission for this staff account.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await adminService.createStaff({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        permissions: selected,
      });
      setMessage(`Staff created: ${result.user.email}`);
      setForm({ name: '', email: '', password: '' });
      setSelected(['CONTENT_READ']);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={authStyles.screenShell}>
      <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
        <ThemedView style={authStyles.content}>
          <ThemedView style={authStyles.headerBand}>
            <AppHeaderBar
              kicker={activeSection === 'dashboard' ? 'Admin workspace' : 'ExamQuest admin'}
              title={activeSection === 'dashboard' ? 'Admin Control' : sectionTitles[activeSection]}
              subtitle={activeSection === 'dashboard' ? `${staffCount === null ? '...' : staffCount} active staff · ${selected.length} permissions selected` : 'Focused workspace'}
              variant={activeSection === 'dashboard' ? 'dashboard' : 'inner'}
              canGoBack={activeSection !== 'dashboard'}
              onBack={() => setActiveSection('dashboard')}
            />
          </ThemedView>

          {activeSection === 'dashboard' ? (
            <AdminQuickLinks staffCount={staffCount} onOpen={setActiveSection} />
          ) : activeSection === 'staff' ? (
            <ThemedView style={authStyles.panel}>
              <SectionBack onPress={() => setActiveSection('dashboard')} />
              <ThemedView style={authStyles.panelHeader}>
                <ThemedText type="sectionTitle">Create staff login</ThemedText>
                <ThemedText type="small" style={authStyles.mutedText}>Give the staff member these credentials after creation.</ThemedText>
              </ThemedView>
              <AuthTextField label="Staff full name" placeholder="Staff full name" value={form.name} onChangeText={(value) => update('name', value)} />
              <AuthTextField label="Staff email" placeholder="staff@example.com" value={form.email} onChangeText={(value) => update('email', value)} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" />
              <AuthTextField label="Temporary password" placeholder="Create temporary password" value={form.password} onChangeText={(value) => update('password', value)} secureTextEntry showPasswordToggle textContentType="newPassword" autoComplete="new-password" helperText="Use a temporary password and ask staff to store it safely." />

              <ThemedView style={authStyles.sectionDivider} />
              <ThemedView style={authStyles.panelHeader}>
                <ThemedText type="sectionTitle">Access permissions</ThemedText>
                <ThemedText type="small" style={authStyles.mutedText}>Checked items become available after staff login.</ThemedText>
              </ThemedView>
              <ThemedText style={authStyles.info}>Admin-only powers like user management are intentionally not assignable here.</ThemedText>
              <View style={authStyles.permissionGrid}>
                {staffPermissions.map((permission) => {
                  const checked = selected.includes(permission.key);
                  return (
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked }}
                      key={permission.key}
                      onPress={() => toggle(permission.key)}
                      style={[authStyles.permissionItem, checked && authStyles.permissionItemSelected]}>
                      <View style={[authStyles.checkbox, checked && authStyles.checkboxSelected]}>
                        <ThemedText style={authStyles.checkboxMark}>{checked ? '✓' : ''}</ThemedText>
                      </View>
                      <View style={authStyles.permissionLabel}>
                        <ThemedText type="smallBold">{permission.label}</ThemedText>
                        <ThemedText type="caption" style={authStyles.mutedText}>{permission.description}</ThemedText>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              {message && <ThemedText style={authStyles.notice}>{message}</ThemedText>}
              {error && <ThemedText style={authStyles.error}>{error}</ThemedText>}
              {loading ? <ActivityIndicator /> : <AuthButton label="Create staff account" onPress={submit} disabled={loading} />}
            </ThemedView>
          ) : (
            <ExamAdminPanel section={activeSection} onBack={() => setActiveSection('dashboard')} onOpenSection={setActiveSection} />
          )}
        </ThemedView>
      </ScrollView>
      <ThemedView style={authStyles.fixedFooter}>
        <ThemedView style={authStyles.footerInner}>
          {activeSection !== 'dashboard' && <AuthButton label="Back to dashboard" onPress={() => setActiveSection('dashboard')} variant="secondary" />}
          <AuthButton label="Back to login" onPress={logout} variant="secondary" />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const sectionTitles: Record<AdminSection, string> = {
  dashboard: 'Admin Control',
  staff: 'Create Staff',
  books: 'Books',
  chapters: 'Chapters',
  import: 'CSV Import',
  question: 'Create Question',
  paper: 'Question Papers',
};

function AdminQuickLinks({ staffCount, onOpen }: { staffCount: number | null; onOpen: (section: AdminSection) => void }) {
  return (
    <ThemedView style={authStyles.panel}>
      <ThemedView style={authStyles.panelHeader}>
        <ThemedText type="sectionTitle">Quick links</ThemedText>
        <ThemedText type="small" style={authStyles.mutedText}>Choose a focused task. Each area opens as its own workspace.</ThemedText>
      </ThemedView>
      <DashboardWorkflowPanel
        title="Build today's exam flow"
        body="Set the content structure first, import the question bank, then publish a timed paper when it is ready for students."
        badge="Admin path"
        steps={[
          { label: 'Create book and chapter', meta: 'Keep content searchable by subject and class.' },
          { label: 'Import or write questions', meta: 'Correct option is saved for backend scoring.' },
          { label: 'Publish scheduled paper', meta: 'Students only see open papers.' },
        ]}
      />
      <View style={authStyles.dashboardGrid}>
        <DashboardActionCard title="Create staff" meta={`${staffCount === null ? '...' : staffCount} active staff`} eyebrow="People" accent="Admin" tone="slate" primary onPress={() => onOpen('staff')} />
        <DashboardActionCard title="Create book" meta="Subject and class setup" eyebrow="Library" accent="01" tone="green" onPress={() => onOpen('books')} />
        <DashboardActionCard title="Create chapter" meta="Book-wise chapters" eyebrow="Structure" accent="02" tone="blue" onPress={() => onOpen('chapters')} />
        <DashboardActionCard title="Import CSV" meta="Bulk MCQ question bank" eyebrow="Question bank" accent="Bulk" tone="amber" primary onPress={() => onOpen('import')} />
        <DashboardActionCard title="Create question" meta="Manual MCQ entry" eyebrow="Question bank" accent="MCQ" tone="blue" onPress={() => onOpen('question')} />
        <DashboardActionCard title="Question papers" meta="Build and publish exams" eyebrow="Exam" accent="Live" tone="green" primary onPress={() => onOpen('paper')} />
      </View>
    </ThemedView>
  );
}

function SectionBack({ onPress }: { onPress: () => void }) {
  return <AuthButton label="Back to dashboard" onPress={onPress} variant="secondary" />;
}
