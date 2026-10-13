import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppHeaderBar } from '@/components/AppHeaderBar';
import { AuthProvider } from '@/store';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <StatusBar barStyle="light-content" backgroundColor="#135083" translucent={false} />
        <AnimatedSplashOverlay />
        <Stack
          screenOptions={{
            headerShown: true,
            header: ({ options, navigation, back }) => (
              <AppHeaderBar
                title={typeof options.title === 'string' ? options.title : 'ExamQuest'}
                variant="route"
                canGoBack={!!back}
                onBack={() => navigation.goBack()}
              />
            ),
            headerStyle: { backgroundColor: '#135083' },
            headerShadowVisible: false,
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { color: '#FFFFFF', fontWeight: '700' },
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
