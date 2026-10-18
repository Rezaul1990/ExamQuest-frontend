import { useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { AuthButton, AuthTextField } from '@/features/auth/components/AuthFields';
import { authStyles } from '@/features/auth/Auth.styles';
import { useLearning } from './hooks/useLearning';
import { filterDiscovery } from './learning.helpers';
import { PracticePanel } from './components/PracticePanel';
import { learningStyles as s } from './components/learning.styles';

export function StudentLearningPanel(){
  const vm=useLearning(),[search,setSearch]=useState(''),[view,setView]=useState<'all'|'upcoming'|'reminders'>('all'),[practice,setPractice]=useState(false);
  const papers=filterDiscovery(vm.discovery?.papers||[],search,view);
  return <View style={s.stack}>
    <View style={s.card}>
      <ThemedText type="sectionTitle">Your learning progress</ThemedText>
      <AuthButton label="Refresh learning & schedule" disabled={vm.loading||vm.busy} onPress={vm.refresh} variant="secondary" />
      {vm.loading&&<ActivityIndicator accessibilityLabel="Loading student workspace" />}
      {!!vm.error&&<ThemedText accessibilityRole="alert" style={authStyles.error}>{vm.error} Retry using Refresh.</ThemedText>}
      {vm.overview&&<>
        <ThemedText>{vm.overview.submissionCount} eligible submissions · latest {vm.overview.window} submitted exams</ThemedText>
        <ThemedText type="caption">Accuracy includes unanswered questions. Historical accepted marks stay unchanged; chapter names follow the current library.</ThemedText>
        {!vm.overview.chapters.length&&<ThemedText>No progress yet. Submit your first eligible exam to build your learning history.</ThemedText>}
        {vm.overview.chapters.map((c)=><View key={c.id} style={s.card}>
          <ThemedText type="smallBold">{c.bookTitle} · {c.chapterTitle}</ThemedText>
          <ThemedText>{c.accuracy}% accuracy · {c.correct}/{c.total} correct · {c.answered} answered</ThemedText>
        </View>)}
        {!!vm.overview.trend.length&&<ThemedText type="smallBold">Recent exam scores</ThemedText>}
        {vm.overview.trend.slice(0,5).map((item)=><ThemedText key={item.attemptId}>{item.title} · {item.percentage}% · {new Date(item.submittedAt).toLocaleDateString()}</ThemedText>)}
        <AuthButton label={practice?'Close practice':'Open practice & bookmarks'} onPress={()=>setPractice(!practice)} variant="secondary" />
      </>}
    </View>
    {practice&&vm.overview&&<>
      <ThemedText type="caption">Showing up to {vm.overview.practiceLimit} recent practice questions ({vm.overview.practiceTotal} eligible in this history window).</ThemedText>
      <PracticePanel key={JSON.stringify(vm.overview.practice.map((q)=>[q.paperId,q.id,q.bookmarked]))} questions={vm.overview.practice} />
    </>}
    <View style={s.card}>
      <ThemedText type="sectionTitle">Exam schedule & reminders</ThemedText>
      <ThemedText type="caption">Reminders are saved to your account and shown here when you open the app. No phone notification is sent. Refresh to update availability; closed, archived and completed papers leave this list.</ThemedText>
      <AuthTextField label="Find an exam" placeholder="Title or subject" value={search} onChangeText={setSearch} maxLength={120} />
      <View style={s.row}>{(['all','upcoming','reminders'] as const).map((item)=><AuthButton key={item} label={`${view===item?'✓ ':''}${{all:'Open & upcoming',upcoming:'Upcoming',reminders:'My reminders'}[item]}`} onPress={()=>setView(item)} variant="secondary" />)}</View>
      {!papers.length&&!vm.loading&&<ThemedText>No matching exams. Upcoming papers appear when Admin publishes a schedule for your class and group.</ThemedText>}
      {papers.map((p)=><View key={p.id} style={s.card}>
        <ThemedText type="smallBold">{p.title}</ThemedText><ThemedText>{p.subject} · {p.questionCount} questions · {p.durationMinutes} minutes</ThemedText>
        <ThemedText>{p.upcoming?'Upcoming':'Open now'} · {p.availableFrom?new Date(p.availableFrom).toLocaleString():'Available now'}{p.availableUntil?` → ${new Date(p.availableUntil).toLocaleString()}`:''}</ThemedText>
        <AuthButton label={p.reminded?'Remove in-app reminder':'Save in-app reminder'} disabled={vm.busy||vm.loading} onPress={()=>vm.reminder(p.id,!p.reminded)} variant="secondary" />
        {!p.upcoming&&<AuthButton label="Open exams" onPress={()=>router.navigate('/exams')} variant="secondary" />}
      </View>)}
    </View>
  </View>;
}
