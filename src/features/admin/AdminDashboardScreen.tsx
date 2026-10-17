import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { router } from 'expo-router';
import { workspaceHref } from '@/features/navigation/navigation';
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
import { examService } from '@/services/examService';
import type { ExamBookDto } from '@/models/api/ExamApi';
import type { AuthUser } from '@/models/domain/Auth';

type AdminSection = 'dashboard' | 'staff' | 'books' | 'chapters' | 'import' | 'question' | 'paper';

export function AdminDashboardScreen({ section = 'dashboard' }: { section?: AdminSection }) {
  const activeSection = section;
  const setActiveSection = (next: AdminSection) => router.navigate(workspaceHref(next));
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [selected, setSelected] = useState<string[]>(['CONTENT_READ']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookIds, setBookIds] = useState<string[]>([]);
  const [scopeBooks, setScopeBooks] = useState<ExamBookDto[]>([]);
  const [staffUsers, setStaffUsers] = useState<AuthUser[]>([]);
  const [staffCount, setStaffCount] = useState<number | null>(null);

  useEffect(() => {
    adminService
      .listUsers()
      .then((result) => { const staff = result.users.filter((user) => user.role === 'STAFF'); setStaffCount(staff.length); setStaffUsers(staff); })
      .catch(() => setStaffCount(null));
  }, [message]);

  useEffect(() => {
    if (activeSection === 'staff') examService.listAdminBooks().then((result) => setScopeBooks(result.books.filter((book) => book.status !== 'archived'))).catch((cause) => setError(getApiErrorMessage(cause)));
  }, [activeSection]);

  async function applyScope(staff: AuthUser) {
    setLoading(true); setError(null);
    try {
      const result = await adminService.updateStaffScope(staff.id, bookIds);
      setStaffUsers((current) => current.map((user) => user.id === staff.id ? result.user : user));
      setMessage('Book access updated for ' + staff.email + '. Staff must sign in again.');
    } catch (cause) { setError(getApiErrorMessage(cause)); }
    finally { setLoading(false); }
  }

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
        bookIds,
      });
      setMessage(`Staff created: ${result.user.email}`);
      setForm({ name: '', email: '', password: '' });
      setSelected(['CONTENT_READ']);
      setBookIds([]);
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
          {activeSection === 'dashboard' ? (
            <AdminQuickLinks staffCount={staffCount} onOpen={setActiveSection} />
          ) : activeSection === 'staff' ? (
            <ThemedView style={authStyles.panel}>
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
              <ThemedText type="sectionTitle">Assigned books</ThemedText>
              <ThemedText type="small">Select the books this staff member can read and manage. No selection means no content access. Permissions still apply.</ThemedText>
              {!scopeBooks.length && <ThemedText>Create books first to assign access.</ThemedText>}
              {scopeBooks.map((book) => <Pressable key={book.id} disabled={loading} accessibilityRole="checkbox" accessibilityState={{ checked: bookIds.includes(book.id) }} aria-checked={bookIds.includes(book.id)} onPress={() => setBookIds((current) => current.includes(book.id) ? current.filter((id) => id !== book.id) : [...current, book.id])} style={[authStyles.permissionItem, bookIds.includes(book.id) && authStyles.permissionItemSelected]}>
                <ThemedText>{bookIds.includes(book.id) ? '✓ ' : ''}{book.className} · {book.subject} · {book.title}</ThemedText>
              </Pressable>)}
              {staffUsers.map((staff) => <View key={staff.id} style={authStyles.listCard}>
                <ThemedText type="smallBold">{staff.name} · {staff.email}</ThemedText>
                <ThemedText type="caption">Currently assigned: {(staff.bookIds || []).map((id) => scopeBooks.find((book) => book.id === id)?.title || id).join(', ') || 'No books'}</ThemedText>
                <AuthButton label="Load this staff member's book selection" disabled={loading} onPress={() => setBookIds(staff.bookIds || [])} variant="secondary" />
                <AuthButton label="Apply selected books to this staff member" disabled={loading} onPress={() => applyScope(staff)} variant="secondary" />
              </View>)}
              {message && <ThemedText style={authStyles.notice}>{message}</ThemedText>}
              {error && <ThemedText style={authStyles.error}>{error}</ThemedText>}
              {loading ? <ActivityIndicator /> : <AuthButton label="Create staff account" onPress={submit} disabled={loading} />}
            </ThemedView>
          ) : (
            <ExamAdminPanel section={activeSection} onOpenSection={setActiveSection} />
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

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
