import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Routes } from '@/constants/Routes';
import { authStyles } from '@/features/auth/Auth.styles';
import { AuthButton, AuthHero, AuthTextField, FormStepHeader } from '@/features/auth/components/AuthFields';
import { getApiErrorMessage } from '@/services/apiClient';
import { authService } from '@/services/authService';

export function RegisterScreen() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    educationLevel: 'SSC' as 'SSC' | 'HSC',
    className: '',
    group: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentRelation: 'Guardian' as 'Father' | 'Mother' | 'Guardian',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function normalizeRelation(value: string) {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'father') return 'Father';
    if (normalized === 'mother') return 'Mother';
    return 'Guardian';
  }

  async function submit() {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password) {
      setError('Fill in student name, email, phone and password before registration.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Password and confirm password must match.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await authService.register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        confirmPassword: form.confirmPassword,
        educationLevel: form.educationLevel.trim().toUpperCase() as 'SSC' | 'HSC',
        className: form.className.trim(),
        group: form.group.trim(),
        parent: {
          name: form.parentName.trim(),
          phone: form.parentPhone.trim(),
          email: form.parentEmail.trim(),
          relation: normalizeRelation(form.parentRelation),
        },
      });
      setMessage(result.message);
      router.replace(Routes.login);
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
              kicker="Member account"
              title="Member Registration"
              body="Create a student account. Email verification is not required, so the member can login after registration."
              badges={['No email verification', 'Guardian info', 'Instant login ready']}
              preview="account"
            />
          </ThemedView>
          <ThemedView style={authStyles.panel}>
            <FormStepHeader number="1" title="Student information" body="These details identify the member in exam records." />
            <AuthTextField label="Full name" placeholder="Student full name" value={form.name} onChangeText={(value) => update('name', value)} />
            <AuthTextField label="Email" placeholder="student@example.com" value={form.email} onChangeText={(value) => update('email', value)} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" />
            <AuthTextField label="Phone" placeholder="01XXXXXXXXX" value={form.phone} onChangeText={(value) => update('phone', value)} keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" />
            <AuthTextField label="Password" placeholder="Create password" value={form.password} onChangeText={(value) => update('password', value)} secureTextEntry showPasswordToggle textContentType="newPassword" autoComplete="new-password" helperText="Use a password the member can remember safely." />
            <AuthTextField label="Confirm password" placeholder="Confirm password" value={form.confirmPassword} onChangeText={(value) => update('confirmPassword', value)} secureTextEntry showPasswordToggle textContentType="newPassword" autoComplete="new-password" />
            <AuthTextField label="Education level" placeholder="SSC or HSC" value={form.educationLevel} onChangeText={(value) => update('educationLevel', value.toUpperCase())} />
            <AuthTextField label="Class / Year" placeholder="Example: Class 10" value={form.className} onChangeText={(value) => update('className', value)} />
            <AuthTextField label="Group" placeholder="Science, Business Studies or Humanities" value={form.group} onChangeText={(value) => update('group', value)} />
          </ThemedView>
          <ThemedView style={authStyles.panel}>
            <FormStepHeader number="2" title="Parent / Guardian" body="Used for student support and account records." />
            <AuthTextField label="Guardian name" placeholder="Parent or guardian name" value={form.parentName} onChangeText={(value) => update('parentName', value)} />
            <AuthTextField label="Guardian phone" placeholder="01XXXXXXXXX" value={form.parentPhone} onChangeText={(value) => update('parentPhone', value)} keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" />
            <AuthTextField label="Guardian email" placeholder="Optional" value={form.parentEmail} onChangeText={(value) => update('parentEmail', value)} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" />
            <AuthTextField label="Relation" placeholder="Father, Mother or Guardian" value={form.parentRelation} onChangeText={(value) => update('parentRelation', value)} />
          </ThemedView>
          {message && <ThemedText style={authStyles.notice}>{message}</ThemedText>}
          {error && <ThemedText style={authStyles.error}>{error}</ThemedText>}
          <Link href={Routes.login}>
            <ThemedText type="linkPrimary">Back to login</ThemedText>
          </Link>
        </ThemedView>
      </ScrollView>
      <ThemedView style={authStyles.fixedFooter}>
        <ThemedView style={authStyles.footerInner}>
          {loading ? <ActivityIndicator /> : <AuthButton label="Register member" onPress={submit} disabled={loading} />}
          <AuthButton label="Back to login" onPress={() => router.replace(Routes.login)} variant="secondary" />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
