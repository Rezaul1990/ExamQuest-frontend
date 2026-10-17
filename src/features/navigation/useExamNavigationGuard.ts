import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useExamNavigation } from './ExamNavigationContext';

export function useExamNavigationGuard(active: boolean, leave: () => Promise<void>) {
  const { setActive } = useExamNavigation();
  const [dialog, setDialog] = useState<'blocked' | 'leave' | null>(null);
  const [leaving, setLeaving] = useState(false);
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
    dialog, leaving, requestLeave: () => setDialog('leave'), dismiss: () => { if (!leaving) setDialog(null); },
    confirm: async () => { if (leaving) return; setLeaving(true); try { await leave(); setDialog(null); } finally { setLeaving(false); } },
  };
}
