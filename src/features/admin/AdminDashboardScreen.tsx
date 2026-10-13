import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { staffPermissions } from '@/constants/Permissions';
import { authStyles } from '@/features/auth/Auth.styles';
import { AuthButton, AuthHero, AuthTextField, ScreenStat } from '@/features/auth/components/AuthFields';
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
            <AuthHero
              kicker="Admin workspace"
              title={activeSection === 'dashboard' ? 'Admin Control' : sectionTitles[activeSection]}
              body={activeSection === 'dashboard' ? 'Open the right workspace from quick links instead of managing everything in one long page.' : 'Use this focused section, then return to the dashboard for another task.'}
              badges={['Role-based access', 'Admin controlled']}
              preview="access">
              <View style={authStyles.statGrid}>
                <ScreenStat label="Active staff" value={staffCount === null ? '...' : String(staffCount)} />
                <ScreenStat label="Permissions selected" value={String(selected.length)} />
              </View>
            </AuthHero>
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
            <ExamAdminPanel section={activeSection} onBack={() => setActiveSection('dashboard')} />
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
      <View style={authStyles.dashboardGrid}>
        <DashboardCard title="Create staff" meta={`${staffCount === null ? '...' : staffCount} active staff`} primary onPress={() => onOpen('staff')} />
        <DashboardCard title="Create book" meta="Subject and class setup" onPress={() => onOpen('books')} />
        <DashboardCard title="Create chapter" meta="Book-wise chapters" onPress={() => onOpen('chapters')} />
        <DashboardCard title="Import CSV" meta="Bulk MCQ question bank" primary onPress={() => onOpen('import')} />
        <DashboardCard title="Create question" meta="Manual MCQ entry" onPress={() => onOpen('question')} />
        <DashboardCard title="Question papers" meta="Build and publish exams" primary onPress={() => onOpen('paper')} />
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

function SectionBack({ onPress }: { onPress: () => void }) {
  return <AuthButton label="Back to dashboard" onPress={onPress} variant="secondary" />;
}
