import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { authService } from '@/services/authService';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAuth } from '@/store';
import { passwordChangeError } from '../profile.helpers';

export function useProfile() {
  const { user, restoring, setUser, changePassword, logout, logoutAll } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'password' | 'logoutAll' | null>(null);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const refreshLock = useRef(false), actionLock = useRef(false);
  const id = user?.id;
  const refresh = useCallback(async () => {
    if (!id || refreshLock.current) return;
    refreshLock.current = true; setRefreshing(true); setError(null);
    try {
      const result = await authService.me();
      if (useAuth.getState().user?.id === id) setUser(result.user);
    } catch (cause) { if (useAuth.getState().user?.id === id) setError(getApiErrorMessage(cause)); }
    finally { refreshLock.current = false; setRefreshing(false); }
  }, [id, setUser]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  function open(next: 'password' | 'logoutAll') { setPasswords({ current: '', next: '', confirm: '' }); setSecurityError(null); setDialog(next); }
  function close() { if (!actionLock.current) { setDialog(null); setPasswords({ current: '', next: '', confirm: '' }); setSecurityError(null); } }
  async function action(kind: 'password' | 'logout' | 'logoutAll') {
    if (actionLock.current) return;
    if (kind === 'password') {
      const validation = passwordChangeError(passwords.current, passwords.next, passwords.confirm);
      if (validation) { setSecurityError(validation); return; }
    }
    actionLock.current = true; setBusy(true); setSecurityError(null); setError(null);
    try {
      if (kind === 'password') await changePassword(passwords.current, passwords.next);
      else if (kind === 'logoutAll') await logoutAll();
      else await logout();
    } catch (cause) { if (useAuth.getState().user?.id === id) { if (dialog) setSecurityError(getApiErrorMessage(cause)); else setError(getApiErrorMessage(cause)); } }
    finally { actionLock.current = false; setBusy(false); }
  }
  return { user, restoring, refreshing, error, securityError, dialog, passwords, busy, refresh, open, close, action, setPasswords };
}
