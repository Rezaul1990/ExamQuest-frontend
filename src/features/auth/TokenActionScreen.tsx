import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Routes } from '@/constants/Routes';
import { authStyles } from '@/features/auth/Auth.styles';
import { AuthButton, AuthHero, AuthTextField } from '@/features/auth/components/AuthFields';
import { getApiErrorMessage } from '@/services/apiClient';
import { authService } from '@/services/authService';
import { useAuth } from '@/store';

type TokenAction = 'verify-email' | 'reset-password' | 'staff-invite' | 'forgot-password';

export function TokenActionScreen({ action }: { action: TokenAction }) {
  const params = useLocalSearchParams<{ token?: string }>();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState(String(params.token || ''));
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      if (action === 'forgot-password') {
        const result = await authService.forgotPassword(email);
        setMessage(result.message);
      }
      if (action === 'verify-email') {
        const result = await authService.verifyEmail(token);
        setUser(result.user);
        setMessage('Email verified. You can login now.');
      }
      if (action === 'reset-password') {
        const result = await authService.resetPassword(token, password);
        setMessage(result.message);
      }
      if (action === 'staff-invite') {
        await authService.acceptStaffInvite(token, password);
        setMessage('Staff account activated. You can login now.');
      }
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setLoading(false);
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
              preview="account"
            />
          </ThemedView>
          <ThemedView style={authStyles.panel}>
            {action === 'forgot-password' && <AuthTextField label="Email" placeholder="name@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" />}
            {(action === 'verify-email' || action === 'reset-password' || action === 'staff-invite') && (
              <AuthTextField label="Token" placeholder="Token from link" value={token} onChangeText={setToken} helperText="Paste the token exactly as provided." />
            )}
            {(action === 'reset-password' || action === 'staff-invite') && (
              <AuthTextField label="New password" placeholder="Create new password" value={password} onChangeText={setPassword} secureTextEntry showPasswordToggle textContentType="newPassword" autoComplete="new-password" />
            )}
            {message && <ThemedText style={authStyles.notice}>{message}</ThemedText>}
            {error && <ThemedText style={authStyles.error}>{error}</ThemedText>}
          </ThemedView>
        </ThemedView>
      </ScrollView>
      <ThemedView style={authStyles.fixedFooter}>
        <ThemedView style={authStyles.footerInner}>
          {loading ? <ActivityIndicator /> : <AuthButton label="Submit" onPress={submit} disabled={loading} />}
          <AuthButton label="Go to login" onPress={() => router.replace(Routes.login)} variant="secondary" />
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
