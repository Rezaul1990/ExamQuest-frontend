import { useLocalSearchParams } from 'expo-router';
import { ManagementScreen } from '@/features/navigation/ManagementScreen';
import { managementSections } from '@/features/navigation/navigation';
export function generateStaticParams() {
 return Object.keys(managementSections).map((section) => ({ section }));
}
export default function ContentWorkspace() {
 const { section } = useLocalSearchParams<{ section: string }>();
 return <ManagementScreen section={section} />;
}
