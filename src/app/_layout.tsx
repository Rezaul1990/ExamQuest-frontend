import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthHeaderUser } from '@/components/auth-header-user';
import { AuthProvider } from '@/store';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <Stack
          screenOptions={{
            headerShown: true,
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerShadowVisible: false,
            headerTintColor: '#146C5D',
            headerTitleStyle: { color: '#0F172A', fontWeight: '700' },
            headerRight: () => <AuthHeaderUser />,
            headerBackTitle: 'Back',
            animation: 'slide_from_right',
            animationDuration: 260,
            animationTypeForReplace: 'push',
            gestureEnabled: true,
            fullScreenGestureEnabled: true,
          }}>
          <Stack.Screen name="index" options={{ animation: 'fade', title: 'ExamQuest', headerBackVisible: false }} />
          <Stack.Screen name="login" options={{ animation: 'fade', title: 'Login' }} />
          <Stack.Screen name="register" options={{ animation: 'slide_from_right', title: 'Member Registration' }} />
          <Stack.Screen name="profile" options={{ animation: 'slide_from_right', title: 'Profile' }} />
          <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_bottom', title: 'Forgot Password' }} />
          <Stack.Screen name="reset-password" options={{ animation: 'slide_from_bottom', title: 'Reset Password' }} />
          <Stack.Screen name="verify-email" options={{ animation: 'slide_from_bottom', title: 'Verify Email' }} />
          <Stack.Screen name="staff-invite" options={{ animation: 'slide_from_bottom', title: 'Staff Invite' }} />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
