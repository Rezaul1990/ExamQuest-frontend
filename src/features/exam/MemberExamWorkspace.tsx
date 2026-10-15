import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ExamQuestColors, Radius, Spacing } from '@/constants/theme';
import { authStyles } from '@/features/auth/Auth.styles';
import { AuthButton, ScreenStat } from '@/features/auth/components/AuthFields';
import type { QuestionPaperDto } from '@/models/api/ExamApi';
import { useMemberExam } from './hooks/useMemberExam';
import { countdownLabel } from './memberExam.helpers';

type MemberExamSection = 'exams' | 'history';

export function MemberExamWorkspace({ section = 'exams', onBack }: { section?: MemberExamSection; onBack?: () => void }) {
  const { books, chapters, papers, attempts, selectedBookId, selectedChapterId, setSelectedBookId, setSelectedChapterId, activeAttempt, activePaper, answers, result, quota, loading, error, message, submitting, saving, saveMessage, secondsLeft, selectAnswer, startPaper, submitExam, leaveAttempt, resumeAttempt, refresh, flushSave } = useMemberExam();
  const selectedBook = books.find((book) => book.id === selectedBookId);
  const selectedChapter = chapters.find((chapter) => chapter.id === selectedChapterId);
  const answeredCount = Object.keys(answers).length;
  const submittedPaperIds = useMemo(() => new Set(attempts.filter((attempt) => attempt.status === 'submitted').map((attempt) => attempt.questionPaperId)), [attempts]);
  const inProgressPaperIds = useMemo(() => new Set(attempts.filter((attempt) => attempt.status === 'in_progress').map((attempt) => attempt.questionPaperId)), [attempts]);
  const visiblePapers = papers.filter((paper) => !submittedPaperIds.has(paper.id));
  if (activeAttempt && activePaper) {
    return (
      <ThemedView style={authStyles.panel}>
        <ThemedView style={authStyles.panelHeader}>
          <ThemedText type="sectionTitle">{activePaper.title}</ThemedText>
          <ThemedText type="small" style={authStyles.mutedText}>
            {answeredCount}/{activeAttempt.questions?.length || activePaper.questionCount} answered · {activePaper.durationMinutes} minutes
          </ThemedText>
        </ThemedView>
        <ThemedText type="sectionTitle" accessibilityLiveRegion="polite">Time left: {countdownLabel(secondsLeft)}</ThemedText>
        <ThemedText type="caption">{saveMessage}{saving ? ' Saving...' : ''}</ThemedText>
        {secondsLeft === 0 && <ThemedText style={authStyles.info}>Time is over. Submission uses the answers saved before the server deadline. Retry below if the connection was interrupted.</ThemedText>}
        <View style={examStyles.progressTrack}>
          <View
            style={[
              examStyles.progressFill,
              { width: `${Math.min(100, Math.round((answeredCount / Math.max(activeAttempt.questions?.length || activePaper.questionCount, 1)) * 100))}%` },
            ]}
          />
        </View>
        {activeAttempt.questions?.map((question, index) => (
          <View key={question.id} style={examStyles.questionCard}>
            <ThemedText type="smallBold">Q{index + 1}. {question.text}</ThemedText>
            {question.options.map((option) => {
              const selected = answers[question.id] === option.key;
              return (
                <Pressable key={option.key} accessibilityRole="radio" accessibilityState={{ checked: selected, disabled: submitting || secondsLeft === 0 }} aria-checked={selected} disabled={submitting || secondsLeft === 0} onPress={() => selectAnswer(question.id, option.key)} style={[examStyles.optionRow, selected && examStyles.optionRowSelected]}>
                  <View style={[authStyles.checkbox, selected && authStyles.checkboxSelected]}>
                    <ThemedText style={authStyles.checkboxMark}>{selected ? '✓' : (option.label || option.key)}</ThemedText>
                  </View>
                  <ThemedText style={examStyles.optionText}>{option.text}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        ))}
        {error && <ThemedText style={authStyles.error}>{error}</ThemedText>}
        {submitting && <ActivityIndicator />}
        <AuthButton label={submitting ? 'Submitting...' : secondsLeft === 0 ? 'Retry expiry submission' : 'Submit exam'} disabled={submitting} onPress={() => submitExam(secondsLeft === 0 ? 'timer_expired' : 'manual')} />
        {secondsLeft > 0 && <AuthButton label="Retry saving answers" disabled={submitting || saving} onPress={flushSave} variant="secondary" />}
        <AuthButton label="Reload saved answers" disabled={submitting || saving} onPress={() => resumeAttempt(activeAttempt.id)} variant="secondary" />
        <AuthButton label="Back to papers" disabled={submitting || saving} onPress={leaveAttempt} variant="secondary" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={authStyles.panel}>
      {onBack && <AuthButton label="Back to dashboard" onPress={onBack} variant="secondary" />}
      <ThemedView style={authStyles.panelHeader}>
        <ThemedText type="sectionTitle">{section === 'exams' ? 'Available exams' : 'Result history'}</ThemedText>
        <ThemedText type="small" style={authStyles.mutedText}>
          {section === 'exams' ? 'Select a book and chapter, start an open question paper, then submit answers for backend scoring.' : 'Review submitted attempts and latest scores.'}
        </ThemedText>
      </ThemedView>
      <View style={authStyles.statGrid}>
        <ScreenStat label="Books" value={String(books.length)} />
        <ScreenStat label="Available papers" value={String(visiblePapers.length)} />
        <ScreenStat label="Attempts" value={String(attempts.length)} />
      </View>
      <AuthButton label="Refresh exams and daily allowance" disabled={loading} onPress={refresh} variant="secondary" />
      {quota && <ThemedText style={quota.canSubmit ? authStyles.info : authStyles.notice}>
        {quota.dayKey} · Asia/Dhaka: {quota.used}/{quota.limit} successful submissions. {quota.canSubmit ? 'Starting and saving do not use this allowance.' : 'Today’s allowance is used. You can submit again after the next Dhaka midnight.'}
      </ThemedText>}
      {loading && <ActivityIndicator />}
      {message && <ThemedText style={authStyles.notice}>{message}</ThemedText>}
      {error && <ThemedText style={authStyles.error}>{error}</ThemedText>}
      {result && (
        <ThemedText style={authStyles.info}>
          Last result: {result.score}/{result.total} ({result.percentage}%)
        </ThemedText>
      )}
      {section === 'exams' ? (
        <>
          <ThemedText type="smallBold">Books</ThemedText>
          <ChipRow items={books.map((book) => ({ id: book.id, label: book.title }))} selectedId={selectedBookId} onSelect={(id) => { setSelectedBookId(id); setSelectedChapterId(''); }} />
          {!books.length && <EmptyState title="No books available" body="Published books will appear here when Admin or Staff prepares the exam library." />}
          {!!selectedBook && <ThemedText type="caption" style={authStyles.mutedText}>{selectedBook.subject} · {selectedBook.className || 'Class open'} · {selectedBook.eligibleGroups?.join(', ') || selectedBook.group || 'Group'}</ThemedText>}
          <ThemedText type="smallBold">Chapters</ThemedText>
          <ChipRow
            items={[{ id: '', label: 'All chapters' }, ...chapters.map((chapter) => ({ id: chapter.id, label: chapter.title }))]}
            selectedId={selectedChapterId}
            onSelect={setSelectedChapterId}
          />
          {!!selectedChapter && <ThemedText type="caption" style={authStyles.mutedText}>Filtered by {selectedChapter.title}</ThemedText>}
          <ThemedText type="smallBold">Published papers</ThemedText>
          {!visiblePapers.length && <EmptyState title="No open papers" body="No published paper is open for the selected book/chapter right now, or you already submitted the available paper." />}
          {visiblePapers.map((paper) => {
            const inProgress = inProgressPaperIds.has(paper.id);
            return (
            <View key={paper.id} style={authStyles.listCard}>
              <View style={authStyles.listCardHeader}>
                <View style={authStyles.listCardCopy}>
                  <ThemedText type="smallBold">{paper.title}</ThemedText>
                  <ThemedText type="caption" style={authStyles.mutedText}>{paper.questionCount} questions · {paper.totalMarks} marks · pass {paper.passMark} · {paper.durationMinutes} min</ThemedText>
                </View>
                <View style={authStyles.workspacePill}>
                  <ThemedText type="caption" style={authStyles.workspacePillText}>{inProgress ? 'Continue' : 'Open'}</ThemedText>
                </View>
              </View>
              <ThemedText type="caption" style={authStyles.mutedText}>Open: {formatWindow(paper)}</ThemedText>
              <AuthButton label={inProgress ? 'Continue exam' : 'Start exam'} disabled={loading || !quota?.canSubmit} onPress={() => startPaper(paper)} />
            </View>
            );
          })}
        </>
      ) : (
        <>
          <ThemedText type="smallBold">Attempt history</ThemedText>
          {!attempts.length && <EmptyState title="No attempts yet" body="After submitting an exam, your score and percentage will be listed here." />}
          {attempts.map((attempt) => (
            <View key={attempt.id} style={authStyles.listCard}>
              <View style={authStyles.listCardHeader}>
                <View style={authStyles.listCardCopy}>
                  <ThemedText type="smallBold">{attempt.paperTitle || 'Question paper'}</ThemedText>
                  <ThemedText type="caption" style={authStyles.mutedText}>{attempt.status === 'submitted' ? `${attempt.submissionMode === 'timer_expired' ? 'Timer submitted' : 'Submitted'} · ${attempt.score}/${attempt.total}` : attempt.status === 'expired' ? 'Closed without successful submission' : 'In progress — not submitted'}</ThemedText>
                </View>
                <View style={authStyles.workspacePill}>
                  <ThemedText type="caption" style={authStyles.workspacePillText}>{attempt.status === 'submitted' ? `${attempt.percentage}%` : '—'}</ThemedText>
                </View>
              </View>
              <AuthButton label={attempt.status === 'submitted' ? 'View result' : attempt.status === 'in_progress' ? 'Resume saved attempt' : 'View closed attempt'} disabled={loading} onPress={() => resumeAttempt(attempt.id)} variant="secondary" />
            </View>
          ))}
        </>
      )}
    </ThemedView>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={authStyles.emptyState}>
      <ThemedText type="smallBold">{title}</ThemedText>
      <ThemedText type="caption" style={authStyles.mutedText}>{body}</ThemedText>
    </View>
  );
}

function ChipRow({ items, selectedId, onSelect }: { items: { id: string; label: string }[]; selectedId: string; onSelect: (id: string) => void }) {
  if (!items.length) {
    return <ThemedText type="caption" style={authStyles.mutedText}>No items yet.</ThemedText>;
  }
  return (
    <View style={examStyles.chipRow}>
      {items.map((item) => (
        <Pressable key={`${item.id}-${item.label}`} onPress={() => onSelect(item.id)} style={[examStyles.chip, selectedId === item.id && examStyles.chipSelected]}>
          <ThemedText type="caption" style={selectedId === item.id ? examStyles.chipTextSelected : examStyles.chipText}>{item.label}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const examStyles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: ExamQuestColors.border,
    paddingHorizontal: Spacing.twoHalf,
    paddingVertical: Spacing.two,
    backgroundColor: ExamQuestColors.surface,
  },
  chipSelected: {
    borderColor: ExamQuestColors.brandPrimary,
    backgroundColor: ExamQuestColors.surfaceSelected,
  },
  chipText: {
    color: ExamQuestColors.textSecondary,
  },
  chipTextSelected: {
    color: ExamQuestColors.brandPrimary,
    fontWeight: '800',
  },
  questionCard: {
    gap: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: ExamQuestColors.border,
    padding: Spacing.three,
    backgroundColor: ExamQuestColors.surfaceSoft,
  },
  optionRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: ExamQuestColors.border,
    padding: Spacing.twoHalf,
    backgroundColor: ExamQuestColors.surface,
  },
  optionRowSelected: {
    borderColor: ExamQuestColors.brandPrimary,
    backgroundColor: ExamQuestColors.surfaceSelected,
  },
  optionText: {
    flex: 1,
    color: ExamQuestColors.textPrimary,
  },
  progressTrack: {
    height: 10,
    overflow: 'hidden',
    borderRadius: Radius.sm,
    backgroundColor: ExamQuestColors.surfaceSoft,
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.sm,
    backgroundColor: ExamQuestColors.brandPrimary,
  },
});

function formatWindow(paper: QuestionPaperDto) {
  const from = paper.availableFrom ? new Date(paper.availableFrom).toLocaleString() : 'Now';
  const until = paper.availableUntil ? new Date(paper.availableUntil).toLocaleString() : 'No deadline';
  return `${from} to ${until}`;
}
