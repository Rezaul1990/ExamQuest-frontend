import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { FeedbackNotice } from '@/components/FeedbackNotice';

import { ThemedView } from '@/components/themed-view';
import { Routes } from '@/constants/Routes';
import { useAuthStyles } from '@/features/auth/Auth.styles';
import { AuthButton, AuthHero, AuthTextField } from '@/features/auth/components/AuthFields';
import { authService } from '@/services/authService';
import { authErrorMessage, normalizeAuthEmail, tokenActionError, tokenActionSuccess, type TokenAction } from './authFeedback';

export function TokenActionScreen({ action }: { action: TokenAction }) {
  const authStyles = useAuthStyles();
  const params = useLocalSearchParams<{ token?: string }>();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(typeof params.token === 'string' ? params.token : '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const submitting = useRef(false);

  async function submit() {
    if (submitting.current || complete) return;
    const invalid = tokenActionError(action, email, token, password);
    setMessage(null);
    if (invalid) { setError(invalid); return; }
    submitting.current = true;
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      if (action === 'forgot-password') {
        await authService.forgotPassword(normalizeAuthEmail(email));
      }
      if (action === 'verify-email') {
        await authService.verifyEmail(token.trim());
      }
      if (action === 'reset-password') {
        await authService.resetPassword(token.trim(), password);
      }
      if (action === 'staff-invite') {
        await authService.acceptStaffInvite(token.trim(), password);
      }
      setMessage(tokenActionSuccess[action]);
      if (action !== 'forgot-password') { setComplete(true); setToken(''); setPassword(''); }
    } catch (submitError) {
      setError(authErrorMessage(submitError));
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  }

  const title = {
    'forgot-password': 'Forgot Password',
    'verify-email': 'Verify Email',
    'reset-password': 'Reset Password',
    'staff-invite': 'Staff Invite',
  }[action];

  return (
    <ThemedView style={authStyles.screenShell}>
      <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
        <ThemedView style={authStyles.content}>
          <ThemedView style={authStyles.headerBand}>
            <AuthHero
              kicker="Account recovery"
              title={title}
              body="Complete the required account step and return to login."
              badges={['Secure flow', 'Return to login']}
              preview={null}
            />
          </ThemedView>
          <ThemedView style={authStyles.panel}>
            {action === 'forgot-password' && <AuthTextField label="ইমেইল" placeholder="name@example.com" value={email} onChangeText={(value) => { setEmail(value); setError(null); setMessage(null); }} editable={!loading} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" autoCorrect={false} returnKeyType="send" onSubmitEditing={submit} />}
            {!complete && (action === 'verify-email' || action === 'reset-password' || action === 'staff-invite') && (
              <AuthTextField label="নিরাপত্তা কোড" placeholder="ইমেইলের লিংক থেকে কোড" value={token} onChangeText={(value) => { setToken(value); setError(null); }} editable={!loading} secureTextEntry autoComplete="off" autoCorrect={false} helperText="ইমেইলের লিংক খুললে কোড পূরণ হবে। কোড কারও সঙ্গে শেয়ার করবেন না।" />
            )}
            {!complete && (action === 'reset-password' || action === 'staff-invite') && (
              <AuthTextField label="নতুন পাসওয়ার্ড" placeholder="নতুন পাসওয়ার্ড লিখুন" value={password} onChangeText={(value) => { setPassword(value); setError(null); }} editable={!loading} secureTextEntry showPasswordToggle textContentType="newPassword" autoComplete="new-password" helperText="১০ থেকে ১২৮ অক্ষরের পাসওয়ার্ড দিন।" onSubmitEditing={submit} returnKeyType="done" />
            )}
            {loading && <FeedbackNotice kind="loading" title="অনুরোধ পাঠানো হচ্ছে…" />}
            {message && <FeedbackNotice kind="success" title="অনুরোধ সম্পন্ন" message={message} />}
            {error && <FeedbackNotice kind="error" title="অনুরোধ সম্পন্ন হয়নি" message={error} />}
          </ThemedView>
        </ThemedView>
      </ScrollView>
      <ThemedView style={authStyles.fixedFooter}>
        <ThemedView style={authStyles.footerInner}>
          {!complete && <AuthButton label={loading ? 'পাঠানো হচ্ছে…' : action === 'forgot-password' ? 'রিসেট লিংক পাঠান' : 'নিশ্চিত করুন'} onPress={submit} busy={loading} disabled={loading} />}
          <AuthButton label="লগইনে ফিরুন" disabled={loading} onPress={() => router.replace(Routes.login)} variant="secondary" />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
