import { AdminDashboardScreen } from '@/features/admin/AdminDashboardScreen';
import { RoleHomeScreen } from '@/features/auth/RoleHomeScreen';
import { useAuth } from '@/store';
export default function HomeScreen() {
 const user = useAuth((state) => state.user);
 return user?.role === 'ADMIN' ? <AdminDashboardScreen /> : <RoleHomeScreen />;
}
