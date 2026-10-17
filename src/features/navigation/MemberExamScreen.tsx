import { ScrollView, View } from 'react-native';
import { authStyles } from '@/features/auth/Auth.styles';
import { MemberExamWorkspace } from '@/features/exam/MemberExamWorkspace';

export function MemberExamScreen({ section }: { section: 'exams' | 'history' }) {
  return <ScrollView contentContainerStyle={authStyles.scrollContent} keyboardShouldPersistTaps="handled">
    <View style={authStyles.content}><MemberExamWorkspace section={section} /></View>
  </ScrollView>;
}
