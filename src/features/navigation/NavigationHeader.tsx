import { router } from 'expo-router';
import { AppHeaderBar } from '@/components/AppHeaderBar';
import { useExamNavigation } from './ExamNavigationContext';

export function NavigationHeader({ title, canGoBack = false, onBack }: { title: string; canGoBack?: boolean; onBack?: () => void }) {
  const { active } = useExamNavigation();
  return <AppHeaderBar title={active ? 'Exam in progress' : title} hideMenu={active} canGoBack={!active && canGoBack} onBack={!active ? onBack : undefined}
    onProfile={!active && title !== 'Profile' ? () => router.navigate('/profile') : undefined} />;
}
