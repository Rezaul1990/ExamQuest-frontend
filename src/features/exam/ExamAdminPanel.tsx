import { useCallback, useEffect, useMemo, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ExamQuestColors, Radius, Spacing } from '@/constants/theme';
import { authStyles } from '@/features/auth/Auth.styles';
import { AuthButton, AuthTextField, ScreenStat } from '@/features/auth/components/AuthFields';
import type { ExamBookDto, ExamChapterDto, ExamQuestionDto, ImportCommitDto, ImportPreviewDto, ImportPreviewRowDto, ImportRowDto, OptionKey, QuestionPaperDto } from '@/models/api/ExamApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { examService } from '@/services/examService';

const csvSample =
  'book,chapter,question,optionA,optionB,optionC,optionD,correctOption,explanation,difficulty,subject,className,group\n' +
  'Physics 1st Paper,Vector,Vector quantity which one?,Force,Mass,Time,Temperature,A,Force has magnitude and direction,easy,Physics,HSC,Science';

type ExamAdminSection = 'books' | 'chapters' | 'import' | 'question' | 'paper';

export function ExamAdminPanel({ section = 'books', onBack, onOpenSection }: { section?: ExamAdminSection; onBack?: () => void; onOpenSection?: (section: ExamAdminSection) => void }) {
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
  const [paperForm, setPaperForm] = useState({
    title: '',
    durationMinutes: '20',
    totalMarks: '20',
    passMark: '8',
    availableFrom: '',
    availableUntil: '',
    status: 'draft',
  });
  const [csvText, setCsvText] = useState(csvSample);
  const [csvFileName, setCsvFileName] = useState('Sample CSV');
  const [previewRows, setPreviewRows] = useState<ImportPreviewRowDto[]>([]);
  const [validRows, setValidRows] = useState<ImportRowDto[]>([]);
  const [previewMessage, setPreviewMessage] = useState('');
  const [importSummary, setImportSummary] = useState<ImportCommitDto | null>(null);
  const [showImportReceipt, setShowImportReceipt] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
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

  async function deleteQuestion(question: ExamQuestionDto) {
    setError(null);
    try {
      await examService.deleteQuestion(question.id);
      setQuestions((current) => current.filter((item) => item.id !== question.id));
      setSelectedQuestionIds((current) => current.filter((id) => id !== question.id));
      setPreviewRows((current) => current.filter((row) => row.existingQuestionId !== question.id));
      setValidRows((current) => current.filter((row) => row.question !== question.text));
      setMessage('Question deleted. You can preview/import the CSV again if needed.');
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    }
  }

  function confirmDeleteQuestion(question: ExamQuestionDto) {
    Alert.alert(
      'Delete question?',
      'This removes the question from Question Bank. It is allowed only when the question is not used in an active question paper.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteQuestion(question) },
      ]
    );
  }

  async function deleteDuplicateQuestion(row: ImportPreviewRowDto) {
    if (!row.existingQuestionId) return;
    const question = questions.find((item) => item.id === row.existingQuestionId) || {
      id: row.existingQuestionId,
      bookId: selectedBookId,
      chapterId: questionForm.chapterId,
      text: row.data.question,
      options: [],
      difficulty: row.data.difficulty || 'medium',
      status: 'active',
    } as ExamQuestionDto;
    await deleteQuestion(question);
    setPreviewMessage('Duplicate question deleted. Preview the CSV again before importing.');
  }

  async function previewCsv() {
    if (!csvText.trim()) return setError('Select or paste a CSV file first.');
    setError(null);
    setImportBusy(true);
    try {
      const result = await examService.previewImport(csvText);
      setPreviewRows(result.rows);
      setValidRows(result.validRows);
      setImportSummary(null);
      setPreviewMessage(buildPreviewMessage(result));
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setImportBusy(false);
    }
  }

  async function commitCsv() {
    if (!validRows.length) return setError('Preview CSV first and make sure at least one row is valid.');
    setError(null);
    setImportBusy(true);
    try {
      const result = await examService.commitImport(validRows);
      setImportSummary(result);
      setShowImportReceipt(true);
      setMessage(result.summary || `${result.importedCount} questions imported.`);
      if (result.questions.length) {
        setQuestions((current) => [...result.questions, ...current.filter((question) => !result.questions.some((item) => item.id === question.id))]);
        setSelectedBookId(result.questions[0].bookId);
        setQuestionForm((current) => ({ ...current, chapterId: result.questions[0].chapterId }));
      }
      setPreviewRows([]);
      setValidRows([]);
      await refreshAll();
      if (result.questions[0]?.bookId) await refreshBookData(result.questions[0].bookId);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setImportBusy(false);
    }
  }

  async function pickCsvFile() {
    setError(null);
    setImportSummary(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', 'text/plain'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset) return;
      const content = asset.file ? await asset.file.text() : await fetch(asset.uri).then((response) => response.text());
      setCsvFileName(asset.name || 'Selected CSV');
      setCsvText(content);
      setPreviewRows([]);
      setValidRows([]);
      setPreviewMessage('CSV loaded. Preview it before importing.');
    } catch {
      setError('Could not read the selected CSV file. Try a plain UTF-8 .csv file.');
    }
  }

  function toggleQuestion(questionId: string) {
    setSelectedQuestionIds((current) => (current.includes(questionId) ? current.filter((id) => id !== questionId) : [...current, questionId]));
  }

  async function createPaper() {
    if (!selectedBookId || !selectedQuestionIds.length) return setError('Select a book and at least one question.');
    if (Number(paperForm.passMark) > Number(paperForm.totalMarks)) return setError('Pass mark cannot be greater than total marks.');
    setError(null);
    try {
      const result = await examService.createQuestionPaper({
        title: paperForm.title,
        bookId: selectedBookId,
        chapterIds: [...new Set(visibleQuestions.filter((question) => selectedQuestionIds.includes(question.id)).map((question) => question.chapterId))],
        durationMinutes: Number(paperForm.durationMinutes),
        totalMarks: Number(paperForm.totalMarks),
        questionIds: selectedQuestionIds,
        availableFrom: paperForm.availableFrom || undefined,
        availableUntil: paperForm.availableUntil || undefined,
        passMark: Number(paperForm.passMark),
        status: paperForm.status,
      });
      setPapers((current) => [result.questionPaper, ...current]);
      setSelectedQuestionIds([]);
      setPaperForm({ title: '', durationMinutes: '20', totalMarks: '20', passMark: '8', availableFrom: '', availableUntil: '', status: 'draft' });
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

  async function deletePaper(paper: QuestionPaperDto) {
    setError(null);
    try {
      const result = await examService.deleteQuestionPaper(paper.id);
      setPapers((current) => current.filter((item) => item.id !== paper.id));
      setMessage(
        result.deletedMode === 'archived'
          ? `Question paper removed from admin/member lists. ${result.attemptCount} attempt record kept safely.`
          : 'Question paper deleted. Its questions remain reusable in Question Bank.'
      );
      if (selectedBookId) await refreshBookData(selectedBookId);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    }
  }

  function confirmDeletePaper(paper: QuestionPaperDto) {
    Alert.alert(
      'Delete question paper?',
      'This removes the paper from exam lists. The original questions will stay in Question Bank and can be used again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deletePaper(paper) },
      ]
    );
  }

  return (
    <ThemedView style={authStyles.panel}>
      {onBack && <AuthButton label="Back to dashboard" onPress={onBack} variant="secondary" />}
      <ThemedView style={authStyles.panelHeader}>
        <ThemedText type="sectionTitle">{sectionTitle[section]}</ThemedText>
        <ThemedText type="small" style={authStyles.mutedText}>
          {sectionHelp[section]}
        </ThemedText>
      </ThemedView>

      {section === 'books' && (
        <View style={authStyles.statGrid}>
          <ScreenStat label="Books" value={String(books.length)} />
          <ScreenStat label="Questions" value={String(questions.length)} />
          <ScreenStat label="Papers" value={String(papers.length)} />
        </View>
      )}

      {section !== 'books' && (
        <WorkspaceSummary
          label="Current book"
          title={selectedBook?.title || 'No book selected'}
          meta={selectedBook ? `${selectedBook.subject || 'Subject open'} · ${selectedBook.className || 'Class open'} · ${selectedBook.group || 'All groups'}` : 'Create a book before building chapters, questions or papers.'}
          badge={`${selectedBookChapters.length} chapters`}
        />
      )}

      {loading && <ActivityIndicator />}
      {message && <ThemedText style={authStyles.notice}>{message}</ThemedText>}
      {error && <ThemedText style={authStyles.error}>{error}</ThemedText>}

      {section === 'books' && <ThemedView style={examStyles.section}>
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
        {!books.length && <EmptyState title="No books yet" body="Create the first book so chapters, questions and papers can be organized properly." />}
      </ThemedView>}

      {section === 'chapters' && <ThemedView style={examStyles.section}>
        <ChipRow items={books.map((book) => ({ id: book.id, label: book.title }))} selectedId={selectedBookId} onSelect={setSelectedBookId} />
        <ThemedText type="smallBold">2. Chapters for {selectedBook?.title || 'selected book'}</ThemedText>
        <AuthTextField label="Chapter title" placeholder="Vector" value={chapterTitle} onChangeText={setChapterTitle} />
        <AuthButton label="Create chapter" onPress={createChapter} variant="secondary" />
        <ChipRow items={selectedBookChapters.map((chapter) => ({ id: chapter.id, label: chapter.title }))} selectedId={questionForm.chapterId} onSelect={(chapterId) => setQuestionForm((current) => ({ ...current, chapterId }))} />
        {!selectedBookChapters.length && <EmptyState title="No chapters for this book" body="Add chapters first, then imported and manual questions can attach to the right chapter." />}
      </ThemedView>}

      {section === 'import' && <ThemedView style={examStyles.section}>
        <ThemedText type="smallBold">3. CSV import</ThemedText>
        <ThemedText type="caption" style={authStyles.mutedText}>
          Select a CSV file or paste rows. Maximum 50 MCQs per import. correctOption must be A/B/C/D and difficulty must be easy/medium/hard.
        </ThemedText>
        <View style={examStyles.importToolbar}>
          <View style={examStyles.importFileCopy}>
            <ThemedText type="caption" style={authStyles.mutedText}>Selected file</ThemedText>
            <ThemedText type="smallBold">{csvFileName}</ThemedText>
          </View>
          <AuthButton label="Select CSV" onPress={pickCsvFile} variant="secondary" />
        </View>
        <TextInput
          accessibilityLabel="CSV import text"
          multiline
          value={csvText}
          onChangeText={(text) => {
            setCsvText(text);
            setCsvFileName('Pasted CSV');
            setPreviewRows([]);
            setValidRows([]);
            setImportSummary(null);
          }}
          placeholder="Paste CSV rows here"
          placeholderTextColor={ExamQuestColors.textMuted}
          style={examStyles.textArea}
        />
        <View style={authStyles.statGrid}>
          <ScreenStat label="Preview rows" value={String(previewRows.length)} />
          <ScreenStat label="Valid" value={String(validRows.length)} />
          <ScreenStat label="Invalid" value={String(Math.max(0, previewRows.length - validRows.length))} />
        </View>
        {!!previewMessage && <ThemedText style={authStyles.info}>{previewMessage}</ThemedText>}
        {importSummary && (
          <ThemedText style={authStyles.notice}>
            Imported {importSummary.importedCount}; duplicate skipped {importSummary.skippedDuplicateCount}; invalid {importSummary.invalidCount}.
          </ThemedText>
        )}
        <View style={authStyles.row}>
          <View style={examStyles.flexField}><AuthButton label={importBusy ? 'Checking...' : 'Preview CSV'} onPress={previewCsv} variant="secondary" /></View>
          <View style={examStyles.flexField}><AuthButton label={importBusy ? 'Saving...' : 'Import valid rows'} onPress={commitCsv} /></View>
        </View>
        {importBusy && <ActivityIndicator />}
        <ImportSuccessModal
          visible={showImportReceipt}
          summary={importSummary}
          onClose={() => setShowImportReceipt(false)}
          onBuildPaper={() => {
            setShowImportReceipt(false);
            onOpenSection?.('paper');
          }}
        />
        {!previewRows.length && <EmptyState title="Preview before import" body="Select a CSV file, preview validation, then import only clean rows into the question bank." />}
        {!!previewRows.length && <ImportPreviewList rows={previewRows} onDeleteDuplicate={deleteDuplicateQuestion} />}
      </ThemedView>}

      {section === 'question' && <ThemedView style={examStyles.section}>
        <ChipRow items={books.map((book) => ({ id: book.id, label: book.title }))} selectedId={selectedBookId} onSelect={setSelectedBookId} />
        <ChipRow items={selectedBookChapters.map((chapter) => ({ id: chapter.id, label: chapter.title }))} selectedId={questionForm.chapterId} onSelect={(chapterId) => setQuestionForm((current) => ({ ...current, chapterId }))} />
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
        <ThemedText type="smallBold">Questions in selected book</ThemedText>
        <ScrollView style={examStyles.questionPicker} nestedScrollEnabled>
          {!visibleQuestions.length && <EmptyState title="No questions found" body="Imported and manually created questions for this book will appear here." />}
          {visibleQuestions.map((question) => (
            <View key={question.id} style={authStyles.listCard}>
              <View style={authStyles.listCardHeader}>
                <View style={authStyles.listCardCopy}>
                  <ThemedText type="smallBold">{question.text}</ThemedText>
                  <ThemedText type="caption" style={authStyles.mutedText}>Correct: {question.correctOption} · {question.difficulty}</ThemedText>
                </View>
              </View>
              <AuthButton label="Delete question" onPress={() => confirmDeleteQuestion(question)} variant="secondary" />
            </View>
          ))}
        </ScrollView>
      </ThemedView>}

      {section === 'paper' && <ThemedView style={examStyles.section}>
        <ChipRow items={books.map((book) => ({ id: book.id, label: book.title }))} selectedId={selectedBookId} onSelect={setSelectedBookId} />
        <ThemedText type="smallBold">5. Question paper builder</ThemedText>
        <AuthTextField label="Paper title" placeholder="Vector chapter practice test" value={paperForm.title} onChangeText={(title) => setPaperForm((current) => ({ ...current, title }))} />
        <View style={authStyles.row}>
          <View style={examStyles.flexField}>
            <AuthTextField label="Duration" placeholder="20" value={paperForm.durationMinutes} onChangeText={(durationMinutes) => setPaperForm((current) => ({ ...current, durationMinutes }))} keyboardType="numeric" />
          </View>
          <View style={examStyles.flexField}>
            <AuthTextField label="Marks" placeholder="20" value={paperForm.totalMarks} onChangeText={(totalMarks) => setPaperForm((current) => ({ ...current, totalMarks }))} keyboardType="numeric" />
          </View>
          <View style={examStyles.flexField}>
            <AuthTextField label="Pass mark" placeholder="8" value={paperForm.passMark} onChangeText={(passMark) => setPaperForm((current) => ({ ...current, passMark }))} keyboardType="numeric" />
          </View>
        </View>
        <View style={authStyles.row}>
          <View style={examStyles.flexField}>
            <AuthTextField
              label="Open from"
              placeholder="2026-10-13T10:00:00+06:00"
              value={paperForm.availableFrom}
              onChangeText={(availableFrom) => setPaperForm((current) => ({ ...current, availableFrom }))}
              helperText="Optional ISO date/time. Leave blank to open immediately."
            />
          </View>
          <View style={examStyles.flexField}>
            <AuthTextField
              label="Open until"
              placeholder="2026-10-13T12:00:00+06:00"
              value={paperForm.availableUntil}
              onChangeText={(availableUntil) => setPaperForm((current) => ({ ...current, availableUntil }))}
              helperText="Optional ISO date/time. Students cannot start after this."
            />
          </View>
        </View>
        <ThemedText type="caption" style={authStyles.mutedText}>Select questions for this paper.</ThemedText>
        <ScrollView style={examStyles.questionPicker} nestedScrollEnabled>
          {!visibleQuestions.length && <EmptyState title="No questions ready" body="Import CSV rows or create manual questions before building a question paper." />}
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
          <View key={paper.id} style={authStyles.listCard}>
            <View style={authStyles.listCardHeader}>
              <View style={authStyles.listCardCopy}>
                <ThemedText type="smallBold">{paper.title}</ThemedText>
                <ThemedText type="caption" style={authStyles.mutedText}>
                  {paper.questionCount} questions · {paper.durationMinutes} min · {paper.totalMarks} marks · pass {paper.passMark}
                </ThemedText>
              </View>
              <View style={authStyles.workspacePill}>
                <ThemedText type="caption" style={authStyles.workspacePillText}>{paper.status}</ThemedText>
              </View>
            </View>
            <ThemedText type="caption" style={authStyles.mutedText}>
              Window: {formatWindow(paper)}
            </ThemedText>
            <AuthButton label={paper.status === 'published' ? 'Unpublish' : 'Publish'} onPress={() => togglePaperStatus(paper)} variant="secondary" />
            <AuthButton label="Delete paper" onPress={() => confirmDeletePaper(paper)} variant="secondary" />
          </View>
        ))}
        {!papers.length && <EmptyState title="No question papers yet" body="Select questions, set duration/marks and publish when the exam window is ready." />}
      </ThemedView>}
    </ThemedView>
  );
}

const sectionTitle: Record<ExamAdminSection, string> = {
  books: 'Create book',
  chapters: 'Create chapter',
  import: 'CSV question import',
  question: 'Create question',
  paper: 'Question paper builder',
};

const sectionHelp: Record<ExamAdminSection, string> = {
  books: 'Create the book/subject container first.',
  chapters: 'Select a book, then create chapters under that book.',
  import: 'Paste CSV rows, preview validation, then import valid questions.',
  question: 'Add one MCQ manually with correct answer and explanation.',
  paper: 'Select questions, schedule availability and publish the exam paper.',
};

function formatWindow(paper: QuestionPaperDto) {
  const from = paper.availableFrom ? new Date(paper.availableFrom).toLocaleString() : 'Now';
  const until = paper.availableUntil ? new Date(paper.availableUntil).toLocaleString() : 'No deadline';
  return `${from} to ${until}`;
}

function buildPreviewMessage(result: ImportPreviewDto) {
  const base = `${result.validCount} valid, ${result.invalidCount} invalid, ${result.duplicateCount} duplicate.`;
  return result.errors?.length ? `${base}\n${result.errors.join('\n')}` : base;
}

function WorkspaceSummary({ label, title, meta, badge }: { label: string; title: string; meta: string; badge: string }) {
  return (
    <View style={authStyles.workspaceToolbar}>
      <View style={authStyles.workspaceToolbarRow}>
        <View style={authStyles.listCardCopy}>
          <ThemedText type="caption" style={authStyles.mutedText}>{label}</ThemedText>
          <ThemedText type="smallBold">{title}</ThemedText>
          <ThemedText type="caption" style={authStyles.mutedText}>{meta}</ThemedText>
        </View>
        <View style={authStyles.workspacePill}>
          <ThemedText type="caption" style={authStyles.workspacePillText}>{badge}</ThemedText>
        </View>
      </View>
    </View>
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

function ImportPreviewList({ rows, onDeleteDuplicate }: { rows: ImportPreviewRowDto[]; onDeleteDuplicate: (row: ImportPreviewRowDto) => void }) {
  return (
    <View style={examStyles.previewList}>
      {rows.map((row) => {
        const invalid = row.errors.length > 0;
        return (
          <View key={`${row.rowNumber}-${row.data.question}`} style={[examStyles.previewRow, invalid && examStyles.previewRowInvalid]}>
            <View style={authStyles.listCardHeader}>
              <View style={authStyles.listCardCopy}>
                <ThemedText type="smallBold">Row {row.rowNumber}: {row.data.question || 'Missing question'}</ThemedText>
                <ThemedText type="caption" style={authStyles.mutedText}>
                  {row.data.className || 'Class open'} · {row.data.group || 'All groups'} · {row.data.subject || row.data.book || 'Subject'} · {row.data.chapter || 'Chapter'}
                </ThemedText>
              </View>
              <View style={[authStyles.workspacePill, invalid && examStyles.previewPillInvalid]}>
                <ThemedText type="caption" style={[authStyles.workspacePillText, invalid && examStyles.previewPillTextInvalid]}>
                  {invalid ? 'Fix' : 'Valid'}
                </ThemedText>
              </View>
            </View>
            <ThemedText type="caption" style={authStyles.mutedText}>
              A {row.data.optionA || '-'} · B {row.data.optionB || '-'} · C {row.data.optionC || '-'} · D {row.data.optionD || '-'} · Correct {row.data.correctOption || '-'} · {row.data.difficulty || 'medium'}
            </ThemedText>
            {invalid && <ThemedText type="caption" style={authStyles.error}>{row.errors.join('\n')}</ThemedText>}
            {row.existingQuestionId && (
              <AuthButton label="Delete existing question" onPress={() => onDeleteDuplicate(row)} variant="secondary" />
            )}
          </View>
        );
      })}
    </View>
  );
}

function ImportSuccessModal({
  visible,
  summary,
  onClose,
  onBuildPaper,
}: {
  visible: boolean;
  summary: ImportCommitDto | null;
  onClose: () => void;
  onBuildPaper: () => void;
}) {
  if (!summary) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={examStyles.modalScrim}>
        <View style={examStyles.successDialog}>
          <View style={examStyles.successMark}>
            <ThemedText style={examStyles.successMarkText}>✓</ThemedText>
          </View>
          <ThemedText type="sectionTitle">Questions imported</ThemedText>
          <ThemedText type="small" style={authStyles.mutedText}>
            {summary.importedCount} question saved to Question Bank. {summary.skippedDuplicateCount} duplicate skipped and {summary.invalidCount} invalid row rejected.
          </ThemedText>
          <View style={authStyles.statGrid}>
            <ScreenStat label="Saved" value={String(summary.importedCount)} />
            <ScreenStat label="Skipped" value={String(summary.skippedDuplicateCount)} />
            <ScreenStat label="Invalid" value={String(summary.invalidCount)} />
          </View>
          <ThemedText style={authStyles.info}>
            Students will see these only after you create and publish a Question Paper from the imported question IDs.
          </ThemedText>
          <View style={authStyles.row}>
            <View style={examStyles.flexField}>
              <AuthButton label="Later" onPress={onClose} variant="secondary" />
            </View>
            <View style={examStyles.flexField}>
              <AuthButton label="Build paper" onPress={onBuildPaper} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
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
  importToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  importFileCopy: {
    flex: 1,
    minWidth: 170,
  },
  previewList: {
    gap: Spacing.two,
  },
  previewRow: {
    borderWidth: 1,
    borderColor: ExamQuestColors.border,
    borderRadius: Radius.md,
    backgroundColor: ExamQuestColors.surface,
    padding: Spacing.twoHalf,
    gap: Spacing.one,
  },
  previewRowInvalid: {
    borderColor: ExamQuestColors.error,
    backgroundColor: ExamQuestColors.errorSoft,
  },
  previewPillInvalid: {
    backgroundColor: ExamQuestColors.errorSoft,
    borderColor: ExamQuestColors.error,
  },
  previewPillTextInvalid: {
    color: ExamQuestColors.error,
  },
  questionPicker: {
    maxHeight: 260,
  },
  modalScrim: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(11, 18, 32, 0.48)',
  },
  successDialog: {
    gap: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: ExamQuestColors.border,
    padding: Spacing.four,
    backgroundColor: ExamQuestColors.surface,
  },
  successMark: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: ExamQuestColors.successSoft,
  },
  successMarkText: {
    color: ExamQuestColors.success,
    fontSize: 24,
    fontWeight: '900',
  },
});
