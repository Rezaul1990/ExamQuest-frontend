import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { AuthButton, AuthTextField } from '@/features/auth/components/AuthFields';
import { authStyles } from '@/features/auth/Auth.styles';
import { academicGroups } from '@/constants/Academic';
import { ExamQuestColors, Radius, Spacing } from '@/constants/theme';
import type { AcademicGroup, QuestionPaperDto } from '@/models/api/ExamApi';
import { usePaperAuthoring } from './hooks/usePaperAuthoring';
import { useAuth } from '@/store';
import { QuestionBankWorkspace } from './QuestionBankWorkspace';
import { paperDraftBlocker } from './paperAuthoring.helpers';

export function PaperAuthoringWorkspace() {
  const vm = usePaperAuthoring();
  const [archiveTarget, setArchiveTarget] = useState<QuestionPaperDto | null>(null);
  const [reviewBank, setReviewBank] = useState(false);
  const [bankBusy, setBankBusy] = useState(false);
  const user = useAuth((state) => state.user);
  const canReviewQuestions = user?.role === 'ADMIN' || !!user?.permissions?.includes('QUESTION_MANAGE');
  const saveBlocker = paperDraftBlocker(vm.selection, vm.form.title, vm.visibleQuestions.length);
  async function closeBank() { if (bankBusy) return; setReviewBank(false); await vm.refresh(); }
  const blocked = vm.busy || vm.loading;
  return <View style={styles.stack}>
    <ThemedText type="sectionTitle">Create a question paper</ThemedText>
    <ThemedText type="small">Choose the audience, select approved questions, preview, review and publish.</ThemedText>
    <ThemedText type="caption">Saving a draft does not make an exam available to members. After saving, mark the paper reviewed, approve it and publish. Only eligible members see published, currently open papers.</ThemedText>
    <AuthButton label="Reload workspace" disabled={blocked} onPress={vm.refresh} variant="secondary" />
    {vm.loading && <ActivityIndicator accessibilityLabel="Loading paper workspace" />}
    {vm.error && <ThemedText style={authStyles.error}>{vm.error}</ThemedText>}
    {!!vm.message && <ThemedText style={authStyles.info}>{vm.message}</ThemedText>}
    {!vm.loading && !vm.books.length && <ThemedText>No books are available. Admin must create books or assign book access to staff.</ThemedText>}
    <View pointerEvents={blocked ? 'none' : 'auto'} style={styles.stack}>
      <ThemedText type="smallBold">1. Class</ThemedText>
      <Choices values={vm.classNames} selected={[vm.selection.className]} onChoose={(value) => vm.changeFilter('className', value)} />
      <ThemedText type="smallBold">2. Eligible audience groups (required)</ThemedText>
      <Choices values={vm.groups} selected={vm.selection.groups} onChoose={(value) => vm.changeFilter('groups', vm.selection.groups.includes(value as AcademicGroup) ? vm.selection.groups.filter((group) => group !== value) : [...vm.selection.groups, value as AcademicGroup])} label={(value) => academicGroups.find((group) => group.value === value)?.label || value} />
      <ThemedText type="smallBold">3. Subject</ThemedText>
      <Choices values={vm.subjects} selected={[vm.selection.subject]} onChoose={(value) => vm.changeFilter('subject', value)} />
      <ThemedText type="smallBold">4. Book / paper</ThemedText>
      <Choices values={vm.matchingBooks.map((book) => book.id)} selected={[vm.selection.bookId]} label={(value) => vm.books.find((book) => book.id === value)?.title || value} onChoose={(value) => vm.changeFilter('bookId', value)} />
      <ThemedText type="smallBold">5. Chapters (select one or more)</ThemedText>
      <Choices values={vm.chapters.map((chapter) => chapter.id)} selected={vm.selection.chapterIds} label={(value) => vm.chapters.find((chapter) => chapter.id === value)?.title || value} onChoose={vm.toggleChapter} />
      <ThemedText type="smallBold">6. Question selection</ThemedText>
      <Choices values={['', 'easy', 'medium', 'hard']} selected={[vm.difficulty]} label={(value) => value || 'Any difficulty'} onChoose={vm.changeDifficulty} />
      <AuthTextField label="Automatic question count" placeholder="20" keyboardType="number-pad" value={vm.count} onChangeText={vm.setCount} />
      <AuthButton label={vm.preferFresh ? 'Prefer fresh / less-used: On' : 'Prefer fresh / less-used: Off'} onPress={() => vm.setPreferFresh(!vm.preferFresh)} variant="secondary" />
      <AuthButton label="Generate selection" disabled={!vm.selection.chapterIds.length} onPress={vm.generate} variant="secondary" />
      <ThemedText type="caption">Manual selection: {vm.selection.questionIds.length} selected. Only active approved questions appear.</ThemedText>
      {!!vm.selection.bookId && <>
        <ThemedText type="caption">Imported questions start as draft. Check each question, correct answer and explanation before marking it reviewed and approving it.</ThemedText>
        {canReviewQuestions ? <AuthButton label="Review question bank for this book" onPress={() => setReviewBank(true)} variant="secondary" /> : <ThemedText type="caption">Ask Admin or Staff with question-management permission to approve bank questions.</ThemedText>}
      </>}
      <ScrollView nestedScrollEnabled style={styles.questions}>
        {!vm.visibleQuestions.length && <ThemedText>No approved questions match these chapters and difficulty. Review the question bank or change filters.</ThemedText>}
        {vm.visibleQuestions.map((question) => <Pressable key={question.id} accessibilityRole="checkbox" accessibilityState={{ checked: vm.selection.questionIds.includes(question.id) }} aria-checked={vm.selection.questionIds.includes(question.id)} onPress={() => vm.toggleQuestion(question.id)} style={[styles.choice, vm.selection.questionIds.includes(question.id) && styles.selected]}>
          <ThemedText type="smallBold">{vm.selection.questionIds.includes(question.id) ? '✓ ' : ''}{question.text}</ThemedText>
          <ThemedText type="caption">{question.difficulty}</ThemedText>
        </Pressable>)}
      </ScrollView>
      <ThemedText type="smallBold">7. Settings {vm.editing ? '(editing saved draft)' : '(new draft)'}</ThemedText>
      {(['title', 'durationMinutes', 'totalMarks', 'passMark', 'availableFrom', 'availableUntil'] as const).map((field) => <AuthTextField key={field} label={{ title: 'Paper title', durationMinutes: 'Duration (minutes)', totalMarks: 'Total marks', passMark: 'Pass mark', availableFrom: 'Open from (optional ISO date/time)', availableUntil: 'Open until (optional ISO date/time)' }[field]} placeholder={field.startsWith('available') ? '2026-10-15T10:00:00+06:00' : field} value={vm.form[field]} onChangeText={(value) => vm.changeForm(field, value)} keyboardType={['durationMinutes','totalMarks','passMark'].includes(field) ? 'number-pad' : 'default'} />)}
      <ThemedText type="caption">Each member can submit this paper once. Future availability opens automatically at the saved time. Publication freezes its questions and answer key.</ThemedText>
      {!!saveBlocker && <ThemedText accessibilityLiveRegion="polite" style={authStyles.notice}>{saveBlocker}</ThemedText>}
      <AuthButton label={vm.busy ? 'Working...' : vm.editing ? 'Save draft changes and preview' : 'Save draft and preview'} onPress={vm.save} disabled={blocked || !!saveBlocker} />
      <AuthButton label="Start a new draft" onPress={vm.reset} variant="secondary" />
    </View>
    <ThemedText type="sectionTitle">Saved papers</ThemedText>
    {!vm.papers.length && !vm.loading && <ThemedText>No papers yet. Save a draft after selecting questions.</ThemedText>}
    {vm.papers.map((paper) => <View key={paper.id} style={authStyles.listCard}>
      <ThemedText type="smallBold">{paper.title}</ThemedText>
      <ThemedText type="caption">{paper.availabilityStatus || paper.status} · {paper.reviewStatus} · {paper.questionCount} questions · {paper.totalMarks} marks · {paper.durationMinutes} min</ThemedText>
      <ThemedText type="caption">{paper.className} · {paper.eligibleGroups.join(', ')} · {paper.subject}</ThemedText>
      <AuthButton label="Student preview / review" disabled={blocked} onPress={() => vm.openPreview(paper)} variant="secondary" />
      {paper.status === 'draft' && <AuthButton label="Edit draft" disabled={blocked} onPress={() => vm.editDraft(paper)} variant="secondary" />}
      <AuthButton label="Archive paper" disabled={blocked} onPress={() => setArchiveTarget(paper)} variant="secondary" />
    </View>)}
    <Modal visible={reviewBank} transparent animationType="slide" onRequestClose={() => { void closeBank(); }}>
      <View style={styles.scrim}><View style={styles.dialog}>
        <ThemedText type="sectionTitle">Review bank questions</ThemedText>
        <ThemedText type="caption">{vm.books.find((book) => book.id === vm.selection.bookId)?.title}. Review and approve each accurate question. Closing reloads approved choices without clearing your paper settings.</ThemedText>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.stack}>
          {reviewBank && canReviewQuestions && <QuestionBankWorkspace bookId={vm.selection.bookId} chapters={vm.chapters} version={vm.questions} admin={user?.role === 'ADMIN'} onBusyChange={setBankBusy} />}
        </ScrollView>
        <AuthButton label="Return to paper and reload approved questions" disabled={bankBusy} onPress={closeBank} variant="secondary" />
      </View></View>
    </Modal>
    <Modal visible={!!vm.preview} transparent animationType="slide" onRequestClose={() => { if (!vm.busy) vm.closePreview(); }}>
      <View style={styles.scrim}><View style={styles.dialog}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.stack}>
          <ThemedText type="sectionTitle">Student perspective preview</ThemedText>
          {vm.preview && <>
            <ThemedText type="smallBold">{vm.preview.questionPaper.title}</ThemedText>
            <ThemedText>Audience: {vm.preview.questionPaper.className} · {vm.preview.questionPaper.eligibleGroups.join(', ')} · {vm.preview.questionPaper.subject}</ThemedText>
            <ThemedText>{vm.preview.questionPaper.durationMinutes} minutes · {vm.preview.questionPaper.totalMarks} marks · Pass {vm.preview.questionPaper.passMark}</ThemedText>
            <ThemedText type="caption">Window: {vm.preview.questionPaper.availableFrom || 'Immediately'} → {vm.preview.questionPaper.availableUntil || 'No deadline'}</ThemedText>
            {vm.preview.warnings.map((warning) => <ThemedText key={warning} style={authStyles.info}>{warning}</ThemedText>)}
            {vm.preview.questions.map((question, index) => <View key={question.id} style={authStyles.listCard}>
              <ThemedText type="smallBold">{index + 1}. {question.text}</ThemedText>
              <ThemedText type="caption">{Number(question.marks.toFixed(4))} marks</ThemedText>
              {question.options.map((option) => <ThemedText key={option.key}>{option.key}. {option.text}</ThemedText>)}
            </View>)}
            <ThemedText type="caption">Review: {vm.preview.questionPaper.reviewStatus}. Check accuracy before approving. Answer keys are omitted from this preview.</ThemedText>
            {vm.preview.questionPaper.status === 'draft' && <>
              {vm.preview.questionPaper.reviewStatus === 'draft' && <AuthButton label="Mark reviewed" disabled={vm.busy} onPress={() => vm.review('reviewed')} />}
              {vm.preview.questionPaper.reviewStatus === 'reviewed' && <AuthButton label="Approve paper" disabled={vm.busy} onPress={() => vm.review('approved')} />}
              {vm.preview.questionPaper.reviewStatus === 'approved' && <AuthButton label="Publish this approved paper" disabled={vm.busy} onPress={vm.publish} />}
            </>}
          </>}
          {vm.error && <ThemedText style={authStyles.error}>{vm.error}</ThemedText>}
          <AuthButton label="Close preview" disabled={vm.busy} onPress={vm.closePreview} variant="secondary" />
        </ScrollView>
      </View></View>
    </Modal>
    <Modal visible={!!archiveTarget} transparent onRequestClose={() => setArchiveTarget(null)}>
      <View style={styles.scrim}><View style={styles.dialog}>
        <ThemedText type="sectionTitle">Archive {archiveTarget?.title}?</ThemedText>
        <ThemedText>The paper leaves available exams. Attempts, scores, snapshots and bank questions are retained.</ThemedText>
        <AuthButton label="Archive" disabled={vm.busy} onPress={async () => { if (archiveTarget) await vm.archive(archiveTarget); setArchiveTarget(null); }} />
        <AuthButton label="Cancel" disabled={vm.busy} onPress={() => setArchiveTarget(null)} variant="secondary" />
      </View></View>
    </Modal>
  </View>;
}
function Choices({ values, selected, onChoose, label = (value) => value }: { values: string[]; selected: string[]; onChoose: (value: string) => void; label?: (value: string) => string }) {
  if (!values.length) return <ThemedText type="caption">Choose the previous field first; matching options appear here.</ThemedText>;
  return <View style={styles.row}>{values.map((value) => <Pressable key={value} accessibilityRole="checkbox" accessibilityState={{ checked: selected.includes(value) }} aria-checked={selected.includes(value)} onPress={() => onChoose(value)} style={[styles.choice, selected.includes(value) && styles.selected]}><ThemedText type="caption">{selected.includes(value) ? '✓ ' : ''}{label(value)}</ThemedText></Pressable>)}</View>;
}
const styles = StyleSheet.create({
  stack: { gap: Spacing.three }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  choice: { padding: Spacing.three, borderRadius: Radius.md, borderWidth: 1, borderColor: ExamQuestColors.border, marginBottom: Spacing.two },
  selected: { backgroundColor: ExamQuestColors.surfaceSelected, borderColor: ExamQuestColors.brandPrimary },
  questions: { maxHeight: 320 }, scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.four },
  dialog: { backgroundColor: ExamQuestColors.surface, borderRadius: Radius.md, padding: Spacing.four, maxHeight: '90%', width: '100%', maxWidth: 760, alignSelf: 'center', gap: Spacing.three },
});
