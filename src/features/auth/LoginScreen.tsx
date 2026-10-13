import { Link, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Routes } from '@/constants/Routes';
import { authStyles } from '@/features/auth/Auth.styles';
import { AuthButton, AuthHero, AuthTextField } from '@/features/auth/components/AuthFields';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAuth } from '@/store';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!email.trim() || !password) {
      setError('Enter both email and password to continue.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.replace(Routes.home);
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
              kicker="Secure access"
              title="ExamQuest Login"
              body="Sign in once and continue with your member, staff or admin workspace."
              badges={['Member', 'Staff', 'Admin']}
            />
          </ThemedView>
          <ThemedView style={authStyles.panel}>
            <ThemedView style={authStyles.panelHeader}>
              <ThemedText type="sectionTitle">Account details</ThemedText>
              <ThemedText type="small" style={authStyles.mutedText}>Use the same email you registered with.</ThemedText>
            </ThemedView>
            <AuthTextField label="Email" placeholder="name@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" />
            <AuthTextField label="Password" placeholder="Enter password" value={password} onChangeText={setPassword} secureTextEntry showPasswordToggle textContentType="password" autoComplete="password" />
            {error && <ThemedText style={authStyles.error}>{error}</ThemedText>}
            <ThemedView style={authStyles.info}>
              <ThemedText type="smallBold">Member accounts are self-service.</ThemedText>
              <ThemedText type="small">Staff access is created by Admin with selected permissions.</ThemedText>
            </ThemedView>
            <ThemedView style={authStyles.sectionDivider} />
            <View style={authStyles.linkRow}>
              <Link href={Routes.register} asChild>
                <Pressable style={authStyles.linkCard}>
                  <ThemedText type="smallBold" style={authStyles.linkCardText}>Create member account</ThemedText>
                </Pressable>
              </Link>
              <Link href={Routes.forgotPassword} asChild>
                <Pressable style={authStyles.linkCard}>
                  <ThemedText type="smallBold" style={authStyles.linkCardText}>Forgot password</ThemedText>
                </Pressable>
              </Link>
            </View>
          </ThemedView>
        </ThemedView>
      </ScrollView>
      <ThemedView style={authStyles.fixedFooter}>
        <ThemedView style={authStyles.footerInner}>
          {loading ? <ActivityIndicator /> : <AuthButton label="Login" onPress={submit} disabled={loading} />}
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}
