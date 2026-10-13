import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ExamQuestColors, Radius, Spacing } from '@/constants/theme';
import { authStyles } from '@/features/auth/Auth.styles';
import { AuthButton, AuthTextField, ScreenStat } from '@/features/auth/components/AuthFields';
import type { ExamBookDto, ExamChapterDto, ExamQuestionDto, ImportRowDto, OptionKey, QuestionPaperDto } from '@/models/api/ExamApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { examService } from '@/services/examService';

const csvSample =
  'book,chapter,question,optionA,optionB,optionC,optionD,correctOption,explanation,difficulty,subject,className,group\n' +
  'Physics 1st Paper,Vector,Vector quantity which one?,Force,Mass,Time,Temperature,A,Force has magnitude and direction,easy,Physics,HSC,Science';

export function ExamAdminPanel() {
  const [books, setBooks] = useState<ExamBookDto[]>([]);
  const [chapters, setChapters] = useState<ExamChapterDto[]>([]);
  const [questions, setQuestions] = useState<ExamQuestionDto[]>([]);
  const [papers, setPapers] = useState<QuestionPaperDto[]>([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [bookForm, setBookForm] = useState({ title: '', subject: '', className: '', group: '' });
  const [chapterTitle, setChapterTitle] = useState('');
  const [questionForm, setQuestionForm] = useState({
    chapterId: '',
    text: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A' as OptionKey,
    explanation: '',
  });
  const [paperForm, setPaperForm] = useState({ title: '', durationMinutes: '20', totalMarks: '20', status: 'draft' });
  const [csvText, setCsvText] = useState(csvSample);
  const [validRows, setValidRows] = useState<ImportRowDto[]>([]);
  const [previewMessage, setPreviewMessage] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedBook = books.find((book) => book.id === selectedBookId);
  const selectedBookChapters = useMemo(() => chapters.filter((chapter) => chapter.bookId === selectedBookId), [chapters, selectedBookId]);
  const visibleQuestions = useMemo(() => questions.filter((question) => question.bookId === selectedBookId), [questions, selectedBookId]);

  const refreshBookData = useCallback(async (bookId: string) => {
    try {
      const [chapterResult, questionResult, paperResult] = await Promise.all([
        examService.listAdminChapters(bookId),
        examService.listAdminQuestions(bookId),
        examService.listAdminQuestionPapers(bookId),
      ]);
      setChapters((current) => [...current.filter((chapter) => chapter.bookId !== bookId), ...chapterResult.chapters]);
      setQuestions((current) => [...current.filter((question) => question.bookId !== bookId), ...questionResult.questions]);
      setPapers((current) => [...current.filter((paper) => paper.bookId !== bookId), ...paperResult.questionPapers]);
      setQuestionForm((current) => ({ ...current, chapterId: chapterResult.chapters[0]?.id || '' }));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookResult, paperResult] = await Promise.all([examService.listAdminBooks(), examService.listAdminQuestionPapers()]);
      setBooks(bookResult.books);
      setPapers(paperResult.questionPapers);
      if (!selectedBookId && bookResult.books[0]) setSelectedBookId(bookResult.books[0].id);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [selectedBookId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (selectedBookId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshBookData(selectedBookId);
    }
  }, [refreshBookData, selectedBookId]);

  async function createBook() {
    setError(null);
    try {
      const result = await examService.createBook({ ...bookForm, status: 'published' });
      setBooks((current) => [result.book, ...current]);
      setSelectedBookId(result.book.id);
      setBookForm({ title: '', subject: '', className: '', group: '' });
      setMessage('Book created.');
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    }
  }

  async function createChapter() {
    if (!selectedBookId) return setError('Create or select a book first.');
    setError(null);
    try {
      const result = await examService.createChapter({ bookId: selectedBookId, title: chapterTitle, status: 'published' });
      setChapters((current) => [result.chapter, ...current]);
      setQuestionForm((current) => ({ ...current, chapterId: result.chapter.id }));
      setChapterTitle('');
      setMessage('Chapter created.');
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    }
  }

  async function createQuestion() {
    if (!selectedBookId || !questionForm.chapterId) return setError('Select a book and chapter first.');
    setError(null);
    try {
      const result = await examService.createQuestion({
        ...questionForm,
        bookId: selectedBookId,
        difficulty: 'medium',
        status: 'active',
      });
      setQuestions((current) => [result.question, ...current]);
      setQuestionForm((current) => ({ ...current, text: '', optionA: '', optionB: '', optionC: '', optionD: '', explanation: '' }));
      setMessage('Question created.');
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    }
  }

  async function previewCsv() {
    setError(null);
    try {
      const result = await examService.previewImport(csvText);
      setValidRows(result.validRows);
      setPreviewMessage(`${result.validCount} valid rows, ${result.invalidCount} invalid rows.`);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    }
  }

  async function commitCsv() {
    if (!validRows.length) return setError('Preview CSV first and make sure at least one row is valid.');
    setError(null);
    try {
      const result = await examService.commitImport(validRows);
      setMessage(`${result.importedCount} questions imported.`);
      setValidRows([]);
      await refreshAll();
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    }
  }

  function toggleQuestion(questionId: string) {
    setSelectedQuestionIds((current) => (current.includes(questionId) ? current.filter((id) => id !== questionId) : [...current, questionId]));
  }

  async function createPaper() {
    if (!selectedBookId || !selectedQuestionIds.length) return setError('Select a book and at least one question.');
    setError(null);
    try {
      const result = await examService.createQuestionPaper({
        title: paperForm.title,
        bookId: selectedBookId,
        chapterIds: [...new Set(visibleQuestions.filter((question) => selectedQuestionIds.includes(question.id)).map((question) => question.chapterId))],
        durationMinutes: Number(paperForm.durationMinutes),
        totalMarks: Number(paperForm.totalMarks),
        questionIds: selectedQuestionIds,
        status: paperForm.status,
      });
      setPapers((current) => [result.questionPaper, ...current]);
      setSelectedQuestionIds([]);
      setPaperForm({ title: '', durationMinutes: '20', totalMarks: '20', status: 'draft' });
      setMessage('Question paper created.');
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    }
  }

  async function togglePaperStatus(paper: QuestionPaperDto) {
    setError(null);
    try {
      const nextStatus = paper.status === 'published' ? 'draft' : 'published';
      const result = await examService.setQuestionPaperStatus(paper.id, nextStatus);
      setPapers((current) => current.map((item) => (item.id === paper.id ? result.questionPaper : item)));
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    }
  }

  return (
    <ThemedView style={authStyles.panel}>
      <ThemedView style={authStyles.panelHeader}>
        <ThemedText type="sectionTitle">Exam content manager</ThemedText>
        <ThemedText type="small" style={authStyles.mutedText}>
          Build books, chapters, question banks and publishable MCQ papers from one workspace.
        </ThemedText>
      </ThemedView>

      <View style={authStyles.statGrid}>
        <ScreenStat label="Books" value={String(books.length)} />
        <ScreenStat label="Questions" value={String(questions.length)} />
        <ScreenStat label="Papers" value={String(papers.length)} />
      </View>

      {loading && <ActivityIndicator />}
      {message && <ThemedText style={authStyles.notice}>{message}</ThemedText>}
      {error && <ThemedText style={authStyles.error}>{error}</ThemedText>}

      <ThemedView style={examStyles.section}>
        <ThemedText type="smallBold">1. Books</ThemedText>
        <AuthTextField label="Book title" placeholder="Physics 1st Paper" value={bookForm.title} onChangeText={(title) => setBookForm((current) => ({ ...current, title }))} />
        <AuthTextField label="Subject" placeholder="Physics" value={bookForm.subject} onChangeText={(subject) => setBookForm((current) => ({ ...current, subject }))} />
        <View style={authStyles.row}>
          <View style={examStyles.flexField}>
            <AuthTextField label="Class" placeholder="HSC" value={bookForm.className} onChangeText={(className) => setBookForm((current) => ({ ...current, className }))} />
          </View>
          <View style={examStyles.flexField}>
            <AuthTextField label="Group" placeholder="Science" value={bookForm.group} onChangeText={(group) => setBookForm((current) => ({ ...current, group }))} />
          </View>
        </View>
        <AuthButton label="Create book" onPress={createBook} />
        <ChipRow items={books.map((book) => ({ id: book.id, label: book.title }))} selectedId={selectedBookId} onSelect={setSelectedBookId} />
      </ThemedView>

      <ThemedView style={examStyles.section}>
        <ThemedText type="smallBold">2. Chapters for {selectedBook?.title || 'selected book'}</ThemedText>
        <AuthTextField label="Chapter title" placeholder="Vector" value={chapterTitle} onChangeText={setChapterTitle} />
        <AuthButton label="Create chapter" onPress={createChapter} variant="secondary" />
        <ChipRow items={selectedBookChapters.map((chapter) => ({ id: chapter.id, label: chapter.title }))} selectedId={questionForm.chapterId} onSelect={(chapterId) => setQuestionForm((current) => ({ ...current, chapterId }))} />
      </ThemedView>

      <ThemedView style={examStyles.section}>
        <ThemedText type="smallBold">3. CSV import</ThemedText>
        <TextInput
          accessibilityLabel="CSV import text"
          multiline
          value={csvText}
          onChangeText={setCsvText}
          placeholder="Paste CSV rows here"
          placeholderTextColor={ExamQuestColors.textMuted}
          style={examStyles.textArea}
        />
        {!!previewMessage && <ThemedText style={authStyles.info}>{previewMessage}</ThemedText>}
        <View style={authStyles.row}>
          <View style={examStyles.flexField}><AuthButton label="Preview CSV" onPress={previewCsv} variant="secondary" /></View>
          <View style={examStyles.flexField}><AuthButton label="Import valid rows" onPress={commitCsv} /></View>
        </View>
      </ThemedView>

      <ThemedView style={examStyles.section}>
        <ThemedText type="smallBold">4. Manual question</ThemedText>
        <AuthTextField label="Question" placeholder="Write MCQ question" value={questionForm.text} onChangeText={(text) => setQuestionForm((current) => ({ ...current, text }))} />
        {(['optionA', 'optionB', 'optionC', 'optionD'] as const).map((key) => (
          <AuthTextField key={key} label={key.replace('option', 'Option ')} placeholder={`${key.replace('option', '')} answer`} value={questionForm[key]} onChangeText={(value) => setQuestionForm((current) => ({ ...current, [key]: value }))} />
        ))}
        <ChipRow
          items={(['A', 'B', 'C', 'D'] as OptionKey[]).map((key) => ({ id: key, label: `Correct ${key}` }))}
          selectedId={questionForm.correctOption}
          onSelect={(correctOption) => setQuestionForm((current) => ({ ...current, correctOption: correctOption as OptionKey }))}
        />
        <AuthTextField label="Explanation" placeholder="Short explanation" value={questionForm.explanation} onChangeText={(explanation) => setQuestionForm((current) => ({ ...current, explanation }))} />
        <AuthButton label="Create question" onPress={createQuestion} />
      </ThemedView>

      <ThemedView style={examStyles.section}>
        <ThemedText type="smallBold">5. Question paper builder</ThemedText>
        <AuthTextField label="Paper title" placeholder="Vector chapter practice test" value={paperForm.title} onChangeText={(title) => setPaperForm((current) => ({ ...current, title }))} />
        <View style={authStyles.row}>
          <View style={examStyles.flexField}>
            <AuthTextField label="Duration" placeholder="20" value={paperForm.durationMinutes} onChangeText={(durationMinutes) => setPaperForm((current) => ({ ...current, durationMinutes }))} keyboardType="numeric" />
          </View>
          <View style={examStyles.flexField}>
            <AuthTextField label="Marks" placeholder="20" value={paperForm.totalMarks} onChangeText={(totalMarks) => setPaperForm((current) => ({ ...current, totalMarks }))} keyboardType="numeric" />
          </View>
        </View>
        <ThemedText type="caption" style={authStyles.mutedText}>Select questions for this paper.</ThemedText>
        <ScrollView style={examStyles.questionPicker} nestedScrollEnabled>
          {visibleQuestions.map((question) => {
            const checked = selectedQuestionIds.includes(question.id);
            return (
              <Pressable key={question.id} onPress={() => toggleQuestion(question.id)} style={[authStyles.permissionItem, checked && authStyles.permissionItemSelected]}>
                <View style={[authStyles.checkbox, checked && authStyles.checkboxSelected]}>
                  <ThemedText style={authStyles.checkboxMark}>{checked ? '✓' : ''}</ThemedText>
                </View>
                <View style={authStyles.permissionLabel}>
                  <ThemedText type="smallBold">{question.text}</ThemedText>
                  <ThemedText type="caption" style={authStyles.mutedText}>Correct: {question.correctOption} · {question.difficulty}</ThemedText>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        <AuthButton label="Create question paper" onPress={createPaper} />
        {papers.map((paper) => (
          <View key={paper.id} style={authStyles.listRow}>
            <ThemedText type="smallBold">{paper.title}</ThemedText>
            <ThemedText type="caption" style={authStyles.mutedText}>{paper.questionCount} questions · {paper.durationMinutes} min · {paper.status}</ThemedText>
            <AuthButton label={paper.status === 'published' ? 'Unpublish' : 'Publish'} onPress={() => togglePaperStatus(paper)} variant="secondary" />
          </View>
        ))}
      </ThemedView>
    </ThemedView>
  );
}

function ChipRow({ items, selectedId, onSelect }: { items: { id: string; label: string }[]; selectedId: string; onSelect: (id: string) => void }) {
  if (!items.length) {
    return <ThemedText type="caption" style={authStyles.mutedText}>No items yet.</ThemedText>;
  }
  return (
    <View style={examStyles.chipRow}>
      {items.map((item) => (
        <Pressable key={item.id} onPress={() => onSelect(item.id)} style={[examStyles.chip, selectedId === item.id && examStyles.chipSelected]}>
          <ThemedText type="caption" style={selectedId === item.id ? examStyles.chipTextSelected : examStyles.chipText}>{item.label}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const examStyles = StyleSheet.create({
  section: {
    gap: Spacing.twoHalf,
    borderTopWidth: 1,
    borderTopColor: ExamQuestColors.border,
    paddingTop: Spacing.three,
  },
  flexField: {
    flex: 1,
    minWidth: 150,
  },
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
  textArea: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: ExamQuestColors.borderStrong,
    borderRadius: Radius.md,
    padding: Spacing.three,
    color: ExamQuestColors.textPrimary,
    backgroundColor: ExamQuestColors.surface,
    textAlignVertical: 'top',
  },
  questionPicker: {
    maxHeight: 260,
  },
});
