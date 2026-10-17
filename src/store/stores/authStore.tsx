import { PropsWithChildren, useEffect } from 'react';
import { create } from 'zustand';

import type { AuthUser } from '@/models/domain/Auth';
import { setAccessToken } from '@/services/apiClient';
import { authService } from '@/services/authService';
import { clearRefreshToken, getRefreshToken, saveRefreshToken } from '@/services/tokenStorage';

type AuthState = {
  user: AuthUser | null;
  restoring: boolean;
  error: string | null;
  isAuthenticated: boolean;
  sessionNotice: { message: string; tone: 'success' | 'warning' } | null;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  restoring: true,
  error: null,
  isAuthenticated: false,
  sessionNotice: null,
  async changePassword(currentPassword, newPassword) {
    await authService.changePassword(currentPassword, newPassword);
    setAccessToken(null);
    try { await clearRefreshToken(); }
    finally { set({ user: null, isAuthenticated: false, error: null, sessionNotice: { message: 'Password updated. Sign in with your new password. All previous sessions have been signed out.', tone: 'success' } }); }
  },
  setUser(user) {
    set({ user, isAuthenticated: Boolean(user) });
  },
  async restoreSession() {
    set({ restoring: true, error: null });
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        set({ user: null, isAuthenticated: false });
        return;
      }
      const session = await authService.refresh(refreshToken);
      setAccessToken(session.accessToken);
      await saveRefreshToken(session.refreshToken);
      set({ user: session.user, isAuthenticated: true, sessionNotice: null });
    } catch {
      setAccessToken(null);
      await clearRefreshToken();
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ restoring: false });
    }
  },
  async login(email, password) {
    set({ error: null });
    try {
      const session = await authService.login(email, password);
      setAccessToken(session.accessToken);
      await saveRefreshToken(session.refreshToken);
      set({ user: session.user, isAuthenticated: true, sessionNotice: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Login failed' });
      throw error;
    }
  },
  async logout() {
    let confirmed = false;
    try {
      await authService.logout();
      confirmed = true;
    } finally {
      setAccessToken(null);
      try { await clearRefreshToken(); }
      finally { set({ user: null, isAuthenticated: false, error: null, sessionNotice: confirmed ? null : { message: 'Signed out on this device. The server could not confirm session revocation.', tone: 'warning' } }); }
    }
  },
  async logoutAll() {
    let confirmed = false;
    try {
      await authService.logoutAll();
      confirmed = true;
    } finally {
      setAccessToken(null);
      try { await clearRefreshToken(); }
      finally { set({ user: null, isAuthenticated: false, error: null, sessionNotice: confirmed ? { message: 'Signed out on all devices. Sign in to continue.', tone: 'success' } : { message: 'Signed out on this device. Other devices could not be signed out. Sign in and try again.', tone: 'warning' } }); }
    }
  },
}));

export function AuthProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    useAuth.getState().restoreSession();
  }, []);

  return children;
}
