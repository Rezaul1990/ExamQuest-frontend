import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { authStyles } from '@/features/auth/Auth.styles';
import { AuthButton, AuthTextField } from '@/features/auth/components/AuthFields';
import type { ExamChapterDto, ExamQuestionDto, OptionKey } from '@/models/api/ExamApi';
import { examService } from '@/services/examService';
import { ExamQuestColors } from '@/constants/theme';
import { useQuestionBank } from './hooks/useQuestionBank';

export function QuestionBankWorkspace({ bookId, chapters, version, admin, onDelete, onBusyChange }: {
  bookId: string; chapters: ExamChapterDto[]; version: ExamQuestionDto[]; admin: boolean; onDelete?: (q: ExamQuestionDto) => void; onBusyChange?: (busy: boolean) => void;
}) {
  const bank = useQuestionBank(bookId, version, admin);
  const [approvalList, setApprovalList] = useState<ExamQuestionDto[] | null>(null);
  const pending = bank.questions.filter((question) => question.status === 'active' && question.reviewStatus !== 'approved');
  useEffect(() => { onBusyChange?.(bank.busy || bank.loading); }, [bank.busy, bank.loading, onBusyChange]);
  const [editing, setEditing] = useState<ExamQuestionDto | null>(null);
  const [form, setForm] = useState({ text: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A' as OptionKey, explanation: '', difficulty: 'medium', status: 'active' });
  function edit(q: ExamQuestionDto) {
    setEditing(q); setForm({ text: q.text, optionA: q.options.find((o) => o.key === 'A')?.text || '', optionB: q.options.find((o) => o.key === 'B')?.text || '', optionC: q.options.find((o) => o.key === 'C')?.text || '', optionD: q.options.find((o) => o.key === 'D')?.text || '', correctOption: q.correctOption || 'A', explanation: q.explanation || '', difficulty: q.difficulty, status: q.status });
  }
  async function save() {
    if (!editing) return;
    if (await bank.act(() => examService.updateQuestion(editing.id, { ...form, revision: editing.revision || 0 }), 'Saved as draft. Review again before paper selection.')) setEditing(null);
  }
  return <View style={{ gap: 12 }}>
    <ThemedText type="smallBold">Question bank</ThemedText>
    <AuthTextField label="Search question text" placeholder="Search this book" value={bank.filters.q || ''} onChangeText={(value) => bank.filter('q', value)} />
    <Choices label="Chapter" values={['', ...chapters.map((c) => c.id)]} names={['All chapters', ...chapters.map((c) => c.title)]} value={bank.filters.chapterId || ''} onChange={(v) => bank.filter('chapterId', v)} />
    <Choices label="Difficulty" values={['', 'easy', 'medium', 'hard']} value={bank.filters.difficulty || ''} onChange={(v) => bank.filter('difficulty', v)} />
    <Choices label="Status" values={['', 'active', 'inactive']} value={bank.filters.status || ''} onChange={(v) => bank.filter('status', v)} />
    <Choices label="Review" values={['', 'draft', 'reviewed', 'approved']} value={bank.filters.reviewStatus || ''} onChange={(v) => bank.filter('reviewStatus', v)} />
    <AuthButton label="Refresh question bank" disabled={bank.loading || bank.busy} onPress={bank.refresh} variant="secondary" />
    {bank.loading && <ActivityIndicator />}
    {!!bank.error && <ThemedText style={authStyles.error}>{bank.error}</ThemedText>}
    {!!bank.message && <ThemedText style={authStyles.notice}>{bank.message}</ThemedText>}
    {admin && pending.length > 0 && <AuthButton label={`Approve ${pending.length} listed questions for paper`} disabled={bank.loading || bank.busy} onPress={() => setApprovalList(pending)} />}
    {!bank.loading && !bank.questions.length && <ThemedText>No questions match these filters.</ThemedText>}
    {admin && <AuthButton label="Load question analytics" disabled={bank.loading || bank.busy || !bank.questions.length} onPress={bank.loadAnalytics} variant="secondary" />}
    {bank.questions.map((q) => {
      const stats = bank.analytics?.find((item) => item.questionId === q.id);
      return <View key={q.id} style={authStyles.listCard}>
        <ThemedText type="smallBold">{q.text}</ThemedText>
        <ThemedText type="caption">{q.difficulty} · {q.status} · {q.reviewStatus || 'approved'} · Used in {q.paperCount || 0} papers</ThemedText>
        {!!q.paperCount && <ThemedText type="caption">Reused question; available for selection again after approval.</ThemedText>}
        {q.options.map((o) => <ThemedText key={o.key} type="caption">{o.key}. {o.text}</ThemedText>)}
        <ThemedText type="caption">Correct: {q.correctOption} · {q.explanation}</ThemedText>
        {stats && <ThemedText type="caption">{stats.submissions} submissions · {stats.answered} answered · {stats.correct} correct · {stats.correctnessPercent === null ? 'No responses yet' : `${stats.correctnessPercent}% correctness`}</ThemedText>}
        <AuthButton label="Edit question" disabled={bank.busy} onPress={() => edit(q)} variant="secondary" />
        {q.reviewStatus !== 'approved' && <AuthButton label={q.reviewStatus === 'reviewed' ? 'Approve question' : 'Mark question reviewed'} disabled={bank.busy} onPress={() => bank.act(() => examService.reviewQuestion(q.id, q.reviewStatus === 'reviewed' ? 'approved' : 'reviewed', q.revision || 0), 'Review updated.')} variant="secondary" />}
        {onDelete && <AuthButton label="Delete question" disabled={bank.busy} onPress={() => onDelete(q)} variant="secondary" />}
      </View>;
    })}
    <ThemedText type="caption">Page {bank.page} · Up to 50 questions per page. Reuse counts include draft and archived papers. Correctness includes unanswered items.</ThemedText>
    <AuthButton label="Previous page" disabled={bank.page === 1 || bank.loading || bank.busy} onPress={() => bank.setPage((p) => p - 1)} variant="secondary" />
    <AuthButton label="Next page" disabled={bank.questions.length < 50 || bank.loading || bank.busy} onPress={() => bank.setPage((p) => p + 1)} variant="secondary" />
    <Modal visible={!!approvalList} transparent animationType="fade" onRequestClose={() => setApprovalList(null)}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={authStyles.panel}>
          <ThemedText type="sectionTitle">Approve {approvalList?.length} listed questions?</ThemedText>
          <ThemedText>Confirm you checked these questions, correct answers and explanations. Only the active questions on this page will be marked reviewed and approved. This does not publish an exam.</ThemedText>
          <AuthButton label="I checked these questions — approve listed" onPress={async () => { const captured = approvalList; setApprovalList(null); if (captured) await bank.approvePage(captured); }} />
          <AuthButton label="Cancel and inspect questions" onPress={() => setApprovalList(null)} variant="secondary" />
        </View>
      </View>
    </Modal>
    <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => { if (!bank.busy) setEditing(null); }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={[authStyles.panel, { maxHeight: '90%' }]}>
          <ThemedText type="sectionTitle">Edit bank question</ThemedText>
          <ScrollView keyboardShouldPersistTaps="handled">
            {(['text', 'optionA', 'optionB', 'optionC', 'optionD', 'explanation'] as const).map((field) => <AuthTextField key={field} label={field === 'text' ? 'Question' : field === 'explanation' ? 'Explanation' : field.replace('option', 'Option ')} placeholder={field === 'text' ? 'Write the question' : 'Enter text'} value={form[field]} editable={!bank.busy} onChangeText={(value) => setForm((f) => ({ ...f, [field]: value }))} />)}
            <Choices label="Correct option" values={['A', 'B', 'C', 'D']} value={form.correctOption} onChange={(v) => setForm((f) => ({ ...f, correctOption: v as OptionKey }))} />
            <Choices label="Difficulty" values={['easy', 'medium', 'hard']} value={form.difficulty} onChange={(v) => setForm((f) => ({ ...f, difficulty: v }))} />
            <Choices label="Status" values={['active', 'inactive']} value={form.status} onChange={(v) => setForm((f) => ({ ...f, status: v }))} />
            <ThemedText type="caption">Published papers and past results retain their frozen content. Saving resets bank review.</ThemedText>
            {!!bank.error && <ThemedText style={authStyles.error}>{bank.error}</ThemedText>}
          </ScrollView>
          <AuthButton label={bank.busy ? 'Saving...' : 'Save question'} disabled={bank.busy} onPress={save} />
          <AuthButton label="Cancel" disabled={bank.busy} onPress={() => setEditing(null)} variant="secondary" />
        </View>
      </View>
    </Modal>
  </View>;
}

function Choices({ label, values, names, value, onChange }: { label: string; values: string[]; names?: string[]; value: string; onChange: (v: string) => void }) {
  return <View style={{ gap: 6 }}><ThemedText type="caption">{label}</ThemedText><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
    {values.map((v, i) => <Pressable key={v} accessibilityRole="radio" accessibilityLabel={`${label}: ${names?.[i] || v || 'All'}`} aria-checked={value === v} accessibilityState={{ checked: value === v }} onPress={() => onChange(v)} style={{ padding: 9, borderWidth: 1, borderRadius: 8, borderColor: value === v ? ExamQuestColors.brandPrimary : ExamQuestColors.border }}><ThemedText type="caption">{names?.[i] || v || 'All'}</ThemedText></Pressable>)}
  </View></View>;
}
