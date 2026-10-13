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
      set({ user: session.user, isAuthenticated: true });
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
      set({ user: session.user, isAuthenticated: true });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Login failed' });
      throw error;
    }
  },
  async logout() {
    try {
      await authService.logout();
    } finally {
      setAccessToken(null);
      await clearRefreshToken();
      set({ user: null, isAuthenticated: false, error: null });
    }
  },
  async logoutAll() {
    try {
      await authService.logoutAll();
    } finally {
      setAccessToken(null);
      await clearRefreshToken();
      set({ user: null, isAuthenticated: false, error: null });
    }
  },
}));

export function AuthProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    useAuth.getState().restoreSession();
  }, []);

  return children;
}
