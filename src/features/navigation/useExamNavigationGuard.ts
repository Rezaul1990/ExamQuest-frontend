import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useExamNavigation } from './ExamNavigationContext';

export function useExamNavigationGuard(active: boolean, leave: () => Promise<boolean>) {
  const { setActive } = useExamNavigation();
  const [dialog, setDialog] = useState<'blocked' | 'leave' | null>(null);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { setActive(active); return () => setActive(false); }, [active, setActive]);
  const explain = useCallback(() => setDialog('blocked'), []);
  usePreventRemove(active, explain);
  useFocusEffect(useCallback(() => {
    if (!active) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { explain(); return true; });
    return () => subscription.remove();
  }, [active, explain]));
  useEffect(() => {
    if (!active || Platform.OS !== 'web') return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [active]);
  return {
    dialog, leaving, error,
    requestLeave: () => { if (!leavingRef.current) { setError(null); setDialog('leave'); } },
    dismiss: () => { if (!leavingRef.current) { setError(null); setDialog(null); } },
    confirm: async () => {
      if (leavingRef.current) return;
      leavingRef.current = true; setLeaving(true); setError(null);
      try {
        if (await leave() === false) setError('Your answers could not be saved. Stay in the exam or retry Save and leave.');
        else setDialog(null);
      } catch {
        setError('Your answers could not be saved. Stay in the exam or retry Save and leave.');
      } finally { leavingRef.current = false; setLeaving(false); }
    },
  };
}
