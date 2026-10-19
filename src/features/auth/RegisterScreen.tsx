import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { FeedbackNotice } from '@/components/FeedbackNotice';

import { AcademicChoices as RegistrationChoices } from './components/AcademicChoices';
import { ThemedView } from '@/components/themed-view';
import { Routes } from '@/constants/Routes';
import { academicGroups, currentAcademicYear, educationLevels, normalizeAcademicYearInput } from '@/constants/Academic';
import { useAuthStyles } from '@/features/auth/Auth.styles';
import { AuthButton, AuthHero, AuthTextField, FormStepHeader } from '@/features/auth/components/AuthFields';
import { guardianRelations, registrationApiError, registrationError, registrationPayload, type RegistrationForm } from './register.helpers';
import { authService } from '@/services/authService';
export { AcademicChoices as RegistrationChoices } from './components/AcademicChoices';

export function RegisterScreen() {
  const authStyles = useAuthStyles();
  const [form, setForm] = useState<RegistrationForm>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    educationLevel: 'SSC',
    className: 'SSC',
    group: '',
    academicYear: currentAcademicYear(),
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    parentRelation: 'Guardian',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const submitting = useRef(false);
  const blocked = loading || complete;

  function update(key: keyof typeof form, value: string) {
    if (submitting.current || complete) return;
    setForm((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  async function submit() {
    if (submitting.current || complete) return;
    const invalid = registrationError(form);
    if (invalid) { setError(invalid); return; }
    submitting.current = true;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await authService.register(registrationPayload(form));
      setComplete(true);
      setForm((current) => ({ ...current, password: '', confirmPassword: '' }));
      setMessage('নিবন্ধন সম্পন্ন হয়েছে। ইমেইল যাচাই ছাড়াই এখন লগইন করতে পারবেন।');
    } catch (submitError) {
      setError(registrationApiError(submitError));
    } finally {
      setLoading(false);
      submitting.current = false;
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
              preview={null}
            />
          </ThemedView>
          <ThemedView style={authStyles.panel}>
            <FormStepHeader number="1" title="Student information" body="These details identify the member in exam records." />
            <AuthTextField label="Full name" placeholder="Student full name" value={form.name} onChangeText={(value) => update('name', value)} editable={!blocked} />
            <AuthTextField label="Email" placeholder="student@example.com" value={form.email} onChangeText={(value) => update('email', value)} editable={!blocked} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" autoCorrect={false} />
            <AuthTextField label="Phone" placeholder="01XXXXXXXXX" value={form.phone} onChangeText={(value) => update('phone', value)} editable={!blocked} keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" />
            <AuthTextField label="Password" placeholder="Create password" value={form.password} onChangeText={(value) => update('password', value)} editable={!blocked} secureTextEntry showPasswordToggle textContentType="newPassword" autoComplete="new-password" helperText="১০ থেকে ১২৮ অক্ষরের পাসওয়ার্ড দিন।" />
            <AuthTextField label="Confirm password" placeholder="Confirm password" value={form.confirmPassword} onChangeText={(value) => update('confirmPassword', value)} editable={!blocked} secureTextEntry showPasswordToggle textContentType="newPassword" autoComplete="new-password" />
            <RegistrationChoices label="শিক্ষার স্তর" options={educationLevels.map((value) => ({ value, label: value }))} selected={form.educationLevel} disabled={blocked} onSelect={(value) => { if (value !== form.educationLevel && !blocked) { update('educationLevel', value); update('className', value); } }} />
            <AuthTextField label="শ্রেণি / বর্ষ" placeholder="SSC / HSC বা ক্যাটালগের শ্রেণি" value={form.className} onChangeText={(value) => update('className', value)} editable={!blocked} helperText="পরীক্ষার ক্যাটালগে ব্যবহৃত শ্রেণির নাম দিন। পুরোনো custom নামও রাখা যায়।" />
            <AuthTextField label="শিক্ষাবর্ষ" placeholder="যেমন: ২০২৬" value={form.academicYear} onChangeText={(value) => update('academicYear', normalizeAcademicYearInput(value))} editable={!blocked} keyboardType="numeric" helperText="২০০০–২১০০-এর মধ্যে চার অঙ্কের বছর দিন। বাংলা বা ইংরেজি অঙ্ক ব্যবহার করতে পারেন।" />
            <RegistrationChoices label="বিভাগ" options={academicGroups} selected={form.group} disabled={blocked} onSelect={(value) => update('group', value)} />
          </ThemedView>
          <ThemedView style={authStyles.panel}>
            <FormStepHeader number="2" title="Parent / Guardian" body="Used for student support and account records." />
            <AuthTextField label="Guardian name" placeholder="Parent or guardian name" value={form.parentName} onChangeText={(value) => update('parentName', value)} editable={!blocked} />
            <AuthTextField label="Guardian phone" placeholder="01XXXXXXXXX" value={form.parentPhone} onChangeText={(value) => update('parentPhone', value)} editable={!blocked} keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" />
            <AuthTextField label="Guardian email" placeholder="Optional" value={form.parentEmail} onChangeText={(value) => update('parentEmail', value)} editable={!blocked} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" autoCorrect={false} returnKeyType="done" onSubmitEditing={submit} />
            <RegistrationChoices label="সম্পর্ক" options={guardianRelations.map((value) => ({ value, label: { Father: 'বাবা', Mother: 'মা', Guardian: 'অভিভাবক' }[value] }))} selected={form.parentRelation} disabled={blocked} onSelect={(value) => update('parentRelation', value)} />
          </ThemedView>
          {loading && <FeedbackNotice kind="loading" title="নিবন্ধন হচ্ছে…" />}
          {message && <FeedbackNotice kind="success" title="অ্যাকাউন্ট তৈরি হয়েছে" message={message} />}
          {error && <FeedbackNotice kind="error" title="নিবন্ধন করা যায়নি" message={error} />}
        </ThemedView>
      </ScrollView>
      <ThemedView style={authStyles.fixedFooter}>
        <ThemedView style={authStyles.footerInner}>
          {!complete && <AuthButton label={loading ? 'নিবন্ধন হচ্ছে…' : 'নিবন্ধন করুন'} onPress={submit} disabled={loading} busy={loading} />}
          <AuthButton label={complete ? 'লগইন করুন' : 'লগইনে ফিরুন'} disabled={loading} onPress={() => router.replace(Routes.login)} variant="secondary" />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
