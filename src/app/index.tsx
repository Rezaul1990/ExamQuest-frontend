import { ActivityIndicator } from 'react-native';

import { AdminDashboardScreen } from '@/features/admin/AdminDashboardScreen';
import { LoginScreen } from '@/features/auth/LoginScreen';
import { RoleHomeScreen } from '@/features/auth/RoleHomeScreen';
import { useAuth } from '@/store';

export default function HomeScreen() {
  const { user, restoring } = useAuth();

  if (restoring) {
    return <ActivityIndicator />;
  }

  if (!user) return <LoginScreen />;
  if (user.role === 'ADMIN') return <AdminDashboardScreen />;
  return <RoleHomeScreen />;
}
