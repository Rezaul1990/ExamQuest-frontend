import type { AuthUser } from '@/models/domain/Auth';
import { apiRequest } from '@/services/apiClient';

export const adminService = {
  createStaff(payload: { name: string; email: string; password: string; permissions: string[] }) {
    return apiRequest<{ user: AuthUser }>('/admin/staff', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  listUsers() {
    return apiRequest<{ users: AuthUser[] }>('/admin/users');
  },
};
