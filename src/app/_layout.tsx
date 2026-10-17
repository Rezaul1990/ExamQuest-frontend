import { DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppHeaderBar } from '@/components/AppHeaderBar';
import { AuthProvider, useAuth } from '@/store';
import { ExamQuestColors } from '@/constants/theme';
SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
 return <SafeAreaProvider><ThemeProvider value={DefaultTheme}><AuthProvider>
  <StatusBar barStyle="dark-content" backgroundColor={ExamQuestColors.surface} translucent={false} />
  <AnimatedSplashOverlay /><RootNavigator />
 </AuthProvider></ThemeProvider></SafeAreaProvider>;
}
function RootNavigator() {
 const { user, restoring } = useAuth();
 if (restoring) return <ActivityIndicator style={{ flex: 1 }} accessibilityLabel="Restoring session" />;
 return <Stack screenOptions={{ header: ({ options, navigation, back }) => <AppHeaderBar title={options.title || 'ExamQuest'} canGoBack={!!back} onBack={() => navigation.goBack()} />, animation: 'slide_from_right', contentStyle: { backgroundColor: ExamQuestColors.background } }}>
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
