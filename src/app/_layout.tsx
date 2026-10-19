import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppHeaderBar } from '@/components/AppHeaderBar';
import { AuthProvider, useAuth } from '@/store';
import { ThemeScope, useTheme, useThemeScheme } from '@/hooks/use-theme';
import { useAppearance } from '@/store/stores/appearanceStore';
SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
 const preference = useAppearance(state => state.preference);
 const hydrate = useAppearance(state => state.hydrate);
 useEffect(() => { void hydrate(); }, [hydrate]);
 return <SafeAreaProvider><ThemeScope value={preference}><AppearanceRoot /></ThemeScope></SafeAreaProvider>;
}
function AppearanceRoot() {
 const theme = useTheme();
 const scheme = useThemeScheme();
 useEffect(() => {
  if (typeof document !== 'undefined') {
   document.documentElement.style.colorScheme = scheme;
   document.body.style.backgroundColor = theme.background;
  }
 }, [scheme, theme.background]);
 const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
 return <ThemeProvider value={{ ...base, colors: { ...base.colors, background: theme.background, card: theme.surface, text: theme.textPrimary, border: theme.border, primary: theme.brandPrimary, notification: theme.error } }}><AuthProvider>
  <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} translucent={false} />
  <AnimatedSplashOverlay /><RootNavigator />
 </AuthProvider></ThemeProvider>;
}
function RootNavigator() {
 const theme = useTheme();
 const { user, restoring } = useAuth();
 if (restoring) return <ActivityIndicator color={theme.brandPrimary} style={{ flex: 1, backgroundColor: theme.background }} accessibilityLabel="Restoring session" />;
 return <Stack screenOptions={{ header: ({ options, navigation, back }) => <AppHeaderBar title={options.title || 'ExamQuest'} canGoBack={!!back} onBack={() => navigation.goBack()} />, animation: 'slide_from_right', contentStyle: { backgroundColor: theme.background } }}>
  <Stack.Protected guard={!!user}><Stack.Screen name="(app)" options={{ headerShown: false }} /></Stack.Protected>
  <Stack.Protected guard={!user}>
   <Stack.Screen name="login" options={{ title: 'Login', animation: 'fade' }} />
   <Stack.Screen name="register" options={{ title: 'Member Registration' }} />
   <Stack.Screen name="forgot-password" options={{ title: 'Forgot Password' }} />
   <Stack.Screen name="reset-password" options={{ title: 'Reset Password' }} />
   <Stack.Screen name="verify-email" options={{ title: 'Verify Email' }} />
   <Stack.Screen name="staff-invite" options={{ title: 'Staff Invite' }} />
  </Stack.Protected>
  <Stack.Screen name="explore" options={{ title: 'Explore' }} />
 </Stack>;
}
