import type { AuthUser } from '@/models/domain/Auth';
import { apiRequest } from '@/services/apiClient';

export const adminService = {
  createStaff(payload: { name: string; email: string; password: string; permissions: string[]; bookIds: string[] }) {
    return apiRequest<{ user: AuthUser }>('/admin/staff', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateStaffScope(id: string, bookIds: string[]) {
    return apiRequest<{ user: AuthUser }>('/admin/staff/' + id + '/scope', { method: 'PATCH', body: JSON.stringify({ bookIds }) });
  },
  listUsers() {
    return apiRequest<{ users: AuthUser[] }>('/admin/users');
  },
};
