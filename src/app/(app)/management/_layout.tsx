import { Stack, router } from 'expo-router';
import { NavigationHeader } from '@/features/navigation/NavigationHeader';
import { managementSections, type ManagementSection } from '@/features/navigation/navigation';

export default function ManagementLayout() {
  return <Stack screenOptions={{ header: ({ options, navigation, back, route }) => <NavigationHeader title={options.title || 'Management'} canGoBack={route.name !== 'index'} onBack={() => back ? navigation.goBack() : router.replace('/management')} /> }}>
    <Stack.Screen name="index" options={{ title: 'Management' }} />
    <Stack.Screen name="[section]" options={({ route }) => ({ title: managementSections[(route.params as { section?: ManagementSection })?.section as ManagementSection]?.title || 'Management' })} />
  </Stack>;
}
