import type { AuthResponseDto, RegisterMemberRequest, RegisterMemberResponse } from '@/models/api/AuthApi';
import type { AuthUser } from '@/models/domain/Auth';
import { apiRequest } from '@/services/apiClient';

export const authService = {
  register(payload: RegisterMemberRequest) {
    return apiRequest<RegisterMemberResponse>('/auth/register', {
      auth: false,
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  login(email: string, password: string) {
    return apiRequest<AuthResponseDto>('/auth/login', {
      auth: false,
      method: 'POST',
      body: JSON.stringify({ email, password, platform: 'expo' }),
    });
  },
  refresh(refreshToken: string) {
    return apiRequest<AuthResponseDto>('/auth/refresh', {
      auth: false,
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
  me() {
    return apiRequest<{ user: AuthUser }>('/auth/me');
  },
  verifyEmail(token: string) {
    return apiRequest<{ user: AuthUser }>('/auth/verify-email', {
      auth: false,
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
  forgotPassword(email: string) {
    return apiRequest<{ message: string }>('/auth/forgot-password', {
      auth: false,
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  resetPassword(token: string, password: string) {
    return apiRequest<{ message: string }>('/auth/reset-password', {
      auth: false,
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },
  acceptStaffInvite(token: string, password: string) {
    return apiRequest<{ user: AuthUser }>('/auth/staff-invite/accept', {
      auth: false,
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },
  logout() {
    return apiRequest('/auth/logout', { method: 'POST' });
  },
  logoutAll() {
    return apiRequest('/auth/logout-all', { method: 'POST' });
  },
};
