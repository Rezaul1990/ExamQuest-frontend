import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { FeedbackNotice } from '@/components/FeedbackNotice';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Routes } from '@/constants/Routes';
import { useAuthStyles } from '@/features/auth/Auth.styles';
import { AuthButton, AuthHero, AuthTextField } from '@/features/auth/components/AuthFields';
import { authErrorMessage, loginError, normalizeAuthEmail } from './authFeedback';
import { useAuth } from '@/store';
import { AppearanceSettings } from '@/features/appearance/AppearanceSettings';

export function LoginScreen() {
  const authStyles = useAuthStyles();
  const { login, sessionNotice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);

  async function submit() {
    if (submitting.current) return;
    const invalid = loginError(email, password);
    if (invalid) {
      setError(invalid);
      return;
    }
    submitting.current = true;
    setLoading(true);
    setError(null);
    try {
      await login(normalizeAuthEmail(email), password);
      router.replace(Routes.home);
    } catch (submitError) {
      setError(authErrorMessage(submitError));
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
              kicker="Secure access"
              title="ExamQuest Login"
              body="Sign in once and continue with your member, staff or admin workspace."
              badges={['Member', 'Staff', 'Admin']}
            />
          </ThemedView>
          <AppearanceSettings />
          <ThemedView style={authStyles.panel}>
            {sessionNotice && <ThemedText accessibilityRole="alert" style={sessionNotice.tone === 'warning' ? authStyles.notice : authStyles.info}>{sessionNotice.message}</ThemedText>}
            <ThemedView style={authStyles.panelHeader}>
              <ThemedText type="sectionTitle">Account details</ThemedText>
              <ThemedText type="small" style={authStyles.mutedText}>Use the same email you registered with.</ThemedText>
            </ThemedView>
            <AuthTextField label="ইমেইল" placeholder="name@example.com" value={email} onChangeText={(value) => { setEmail(value); setError(null); }} editable={!loading} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" autoCorrect={false} />
            <AuthTextField label="পাসওয়ার্ড" placeholder="পাসওয়ার্ড লিখুন" value={password} onChangeText={(value) => { setPassword(value); setError(null); }} editable={!loading} secureTextEntry showPasswordToggle textContentType="password" autoComplete="password" onSubmitEditing={submit} returnKeyType="go" />
            {loading && <FeedbackNotice kind="loading" title="লগইন হচ্ছে…" />}
            {error && <FeedbackNotice kind="error" title="লগইন করা যায়নি" message={error} />}
            <ThemedView style={authStyles.info}>
              <ThemedText type="smallBold">Member accounts are self-service.</ThemedText>
              <ThemedText type="small">Staff access is created by Admin with selected permissions.</ThemedText>
            </ThemedView>
            <ThemedView style={authStyles.sectionDivider} />
            <View style={authStyles.linkRow}>
              <Link href={Routes.register} asChild>
                <Pressable disabled={loading} style={authStyles.linkCard}>
                  <ThemedText type="smallBold" style={authStyles.linkCardText}>Create member account</ThemedText>
                </Pressable>
              </Link>
              <Link href={Routes.forgotPassword} asChild>
                <Pressable disabled={loading} style={authStyles.linkCard}>
                  <ThemedText type="smallBold" style={authStyles.linkCardText}>Forgot password</ThemedText>
                </Pressable>
              </Link>
            </View>
          </ThemedView>
        </ThemedView>
      </ScrollView>
      <ThemedView style={authStyles.fixedFooter}>
        <ThemedView style={authStyles.footerInner}>
          <AuthButton label={loading ? 'লগইন হচ্ছে…' : 'লগইন'} onPress={submit} busy={loading} disabled={loading} />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
