import { Tabs } from 'expo-router/js-tabs';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/store';
import { PaperSourceProvider } from '@/features/exam/PaperSourceContext';
import { ExamNavigationProvider, useExamNavigation } from './ExamNavigationContext';
import { NavigationHeader } from './NavigationHeader';
import { canOpenTab, tabConfig, type TabName } from './navigation';

export default function AuthenticatedTabs() {
  const user = useAuth((state) => state.user);
  return <ExamNavigationProvider key={user?.id}><PaperSourceProvider><RoleTabs /></PaperSourceProvider></ExamNavigationProvider>;
}
function RoleTabs() {
  const ExamQuestColors = useTheme();
  const user = useAuth((state) => state.user);
  const { active } = useExamNavigation();
  const insets = useSafeAreaInsets();
  return <Tabs backBehavior="history" screenListeners={{ tabPress: (event) => { if (active) event.preventDefault(); } }}
    screenOptions={{
      header: ({ options }) => <NavigationHeader title={options.title || 'ExamQuest'} />,
      sceneStyle: { backgroundColor: ExamQuestColors.background },
      tabBarHideOnKeyboard: true,
      tabBarActiveTintColor: ExamQuestColors.brandPrimary,
      tabBarInactiveTintColor: ExamQuestColors.textSecondary,
      tabBarLabelStyle: Typography.tab,
      tabBarStyle: active ? { display: 'none' } : { height: 64 + insets.bottom, paddingTop: 6, paddingBottom: Math.max(insets.bottom, 6), backgroundColor: ExamQuestColors.surface, borderTopColor: ExamQuestColors.border },
    }}>
    {(Object.keys(tabConfig) as TabName[]).map((name) => {
      const config = tabConfig[name];
      return <Tabs.Protected key={name} guard={canOpenTab(user, name)}><Tabs.Screen name={name} options={{
        title: config.title, tabBarLabel: config.label, tabBarAccessibilityLabel: `${config.label} tab`,
        headerShown: name !== 'management',
        tabBarIcon: ({ color }) => <SymbolView name={config.icon} size={22} tintColor={color} />,
      }} /></Tabs.Protected>;
    })}
    <Tabs.Protected guard={canOpenTab(user, 'progress')}>
      <Tabs.Screen name="results" options={{ href: null }} />
    </Tabs.Protected>
  </Tabs>;
}
