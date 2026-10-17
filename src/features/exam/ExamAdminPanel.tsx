import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { PaperAuthoringWorkspace } from './PaperAuthoringWorkspace';
import { QuestionBankWorkspace } from './QuestionBankWorkspace';
import { academicGroups } from '@/constants/Academic';
import { useAuth } from '@/store';
import { exportImportReport } from '@/services/importReportService';
import { buildImportErrorReport, importHeaders, serializeImportRows } from './csvImport.helpers';
import { importedPaperSource } from './paperAuthoring.helpers';
import { usePaperSource } from './PaperSourceContext';

const csvSample =
  'book,chapter,question,optionA,optionB,optionC,optionD,correctOption,explanation,difficulty,subject,className,group\n' +
  'Physics 1st Paper,Vector,Vector quantity which one?,Force,Mass,Time,Temperature,A,Force has magnitude and direction,easy,Physics,HSC,Science';

type ExamAdminSection = 'books' | 'chapters' | 'import' | 'question' | 'paper';
const sectionPermission: Record<ExamAdminSection, string> = { books: 'CONTENT_READ', chapters: 'CONTENT_MANAGE', import: 'QUESTION_MANAGE', question: 'QUESTION_MANAGE', paper: 'EXAM_MANAGE' };

export function ExamAdminPanel({ section = 'books', onBack, onOpenSection }: { section?: ExamAdminSection; onBack?: () => void; onOpenSection?: (section: ExamAdminSection) => void }) {
  const user = useAuth((state) => state.user);
  const canManageExams = user?.role === 'ADMIN' || (user?.role === 'STAFF' && !!user.permissions?.includes('EXAM_MANAGE'));
  const canManageQuestions = user?.role === 'ADMIN' || (user?.role === 'STAFF' && !!user.permissions?.includes('QUESTION_MANAGE'));
  const [bookEligibleGroups, setBookEligibleGroups] = useState<string[]>([]);
  const [books, setBooks] = useState<ExamBookDto[]>([]);
  const [chapters, setChapters] = useState<ExamChapterDto[]>([]);
  const [questions, setQuestions] = useState<ExamQuestionDto[]>([]);
  const [papers, setPapers] = useState<QuestionPaperDto[]>([]);
  const [selectedBookId, setSelectedBookId] = useState('');
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
  const [csvText, setCsvText] = useState(csvSample);
  const [csvFileName, setCsvFileName] = useState('Sample CSV');
  const [previewRows, setPreviewRows] = useState<ImportPreviewRowDto[]>([]);
  const [validRows, setValidRows] = useState<ImportRowDto[]>([]);
  const [previewMessage, setPreviewMessage] = useState('');
  const [importSummary, setImportSummary] = useState<ImportCommitDto | null>(null);
  const [showImportReceipt, setShowImportReceipt] = useState(false);
  const { source: paperSource, setSource: setPaperSource } = usePaperSource();
  const [editingRow, setEditingRow] = useState<ImportPreviewRowDto | null>(null);
  const [editForm, setEditForm] = useState<ImportRowDto | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const importLock = useRef(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedBook = books.find((book) => book.id === selectedBookId);
  const selectedBookChapters = useMemo(() => chapters.filter((chapter) => chapter.bookId === selectedBookId), [chapters, selectedBookId]);

  const refreshBookData = useCallback(async (bookId: string) => {
    try {
      const [chapterResult, questionResult, paperResult] = await Promise.all([
        examService.listAdminChapters(bookId),
        canManageQuestions ? examService.listAdminQuestions(bookId) : Promise.resolve({ questions: [] as ExamQuestionDto[] }),
        canManageExams ? examService.listAdminQuestionPapers(bookId) : Promise.resolve({ questionPapers: [] as QuestionPaperDto[] }),
      ]);
      setChapters((current) => [...current.filter((chapter) => chapter.bookId !== bookId), ...chapterResult.chapters]);
      setQuestions((current) => [...current.filter((question) => question.bookId !== bookId), ...questionResult.questions]);
      setPapers((current) => [...current.filter((paper) => paper.bookId !== bookId), ...paperResult.questionPapers]);
      setQuestionForm((current) => ({ ...current, chapterId: chapterResult.chapters[0]?.id || '' }));
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    }
  }, [canManageQuestions, canManageExams]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bookResult, paperResult] = await Promise.all([examService.listAdminBooks(), canManageExams ? examService.listAdminQuestionPapers() : Promise.resolve({ questionPapers: [] as QuestionPaperDto[] })]);
      setBooks(bookResult.books);
      setPapers(paperResult.questionPapers);
      if (!selectedBookId && bookResult.books[0]) setSelectedBookId(bookResult.books[0].id);
    } catch (loadError) {
      setError(getApiErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [selectedBookId, canManageExams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (section !== 'paper') refreshAll();
  }, [refreshAll, section]);

  useEffect(() => {
    if (selectedBookId && section !== 'paper') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      refreshBookData(selectedBookId);
    }
  }, [refreshBookData, selectedBookId, section]);

  async function createBook() {
    setError(null);
    if (!bookEligibleGroups.length || !bookForm.className.trim()) return setError('Select eligible book groups and enter class.');
    try {
      const result = await examService.createBook({ ...bookForm, group: bookEligibleGroups[0], eligibleGroups: bookEligibleGroups, status: 'published' });
      setBooks((current) => [result.book, ...current]);
      setSelectedBookId(result.book.id);
      setBookForm({ title: '', subject: '', className: '', group: '' });
      setBookEligibleGroups([]);
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

  async function previewCsv() {
    if (importLock.current) return;
    if (!csvText.trim()) return setError('Select or paste a CSV file first.');
    importLock.current = true;
    setError(null);
    setImportBusy(true);
    try {
      const result = await examService.previewImport(csvText);
      applyServerPreview(result);
      setImportSummary(null);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setImportBusy(false);
      importLock.current = false;
    }
  }

  async function commitCsv() {
    if (importLock.current || fileErrors.length) return;
    if (!validRows.length) return setError('Preview CSV first and make sure at least one row is valid.');
    setError(null);
    setImportBusy(true);
    importLock.current = true;
    try {
      const retainedRows = previewRows.filter((row) => row.errors.length);
      const currentRows = previewRows.filter((row) => !row.errors.length);
      const result = await examService.commitImport(currentRows.map((row) => row.data), currentRows.map((row) => row.rowNumber));
      setImportSummary(result);
      setShowImportReceipt(result.importedCount > 0);
      setMessage(result.summary || `${result.importedCount} questions imported.`);
      if (result.questions.length) {
        setQuestions((current) => [...result.questions, ...current.filter((question) => !result.questions.some((item) => item.id === question.id))]);
        setSelectedBookId(result.questions[0].bookId);
        setQuestionForm((current) => ({ ...current, chapterId: result.questions[0].chapterId }));
      }
      if (retainedRows.length || result.invalidCount || result.skippedDuplicateCount || result.errors?.length) {
        const remaining = [...retainedRows, ...result.rows.filter((row) => row.errors.length)].sort((a, b) => a.rowNumber - b.rowNumber);
        applyServerPreview({ rows: remaining, validRows: [], validCount: 0, invalidCount: remaining.length, duplicateCount: remaining.filter((row) => row.duplicate).length, errors: result.errors });
      } else clearPreview();
      await refreshAll();
      if (result.questions[0]?.bookId) await refreshBookData(result.questions[0].bookId);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    } finally {
      setImportBusy(false);
      importLock.current = false;
    }
  }

  function clearPreview() {
    setPreviewRows([]);
    setValidRows([]);
    setFileErrors([]);
    setPreviewMessage('');
  }

  function applyServerPreview(result: ImportPreviewDto) {
    setPreviewRows(result.rows);
    setFileErrors(result.errors || []);
    setValidRows(result.errors?.length ? [] : result.rows.filter((row) => !row.errors.length).map((row) => row.data));
    setPreviewMessage(buildPreviewMessage(result));
  }

  async function revalidateRows(rows: ImportPreviewRowDto[]) {
    if (importLock.current || fileErrors.length) return false;
    if (!rows.length) { clearPreview(); return true; }
    importLock.current = true;
    setImportBusy(true);
    setValidRows([]);
    setError(null);
    try {
      const result = await examService.previewImport(serializeImportRows(rows.map((row) => row.data)), rows.map((row) => row.rowNumber));
      // A malformed-width record remains invalid until explicitly edited or removed.
      result.rows = result.rows.map((row) => ({ ...row, errors: [...row.errors, ...(rows.find((source) => source.rowNumber === row.rowNumber)?.errors.filter((error) => error.startsWith('Expected 13 columns')) || [])] }));
      result.validCount = result.rows.filter((row) => !row.errors.length).length;
      result.invalidCount = result.rows.length - result.validCount;
      applyServerPreview(result);
      setImportSummary(null);
      return true;
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
      return false;
    } finally {
      setImportBusy(false);
      importLock.current = false;
    }
  }

  function removePreviewRow(rowNumber: number) {
    void revalidateRows(previewRows.filter((row) => row.rowNumber !== rowNumber));
  }

  function removeDuplicatePreviewRows() {
    void revalidateRows(previewRows.filter((row) => !row.duplicate));
  }

  function openEditRow(row: ImportPreviewRowDto) {
    if (importLock.current || fileErrors.length) return;
    setEditingRow(row);
    setEditForm({ ...row.data });
  }

  async function saveEditedRow() {
    if (!editingRow || !editForm) return;
    const saved = await revalidateRows(previewRows.map((row) => row.rowNumber === editingRow.rowNumber ? { ...row, data: editForm, errors: [] } : row));
    if (saved) { setEditingRow(null); setEditForm(null); }
  }

  async function shareImportErrorReport() {
    if (!fileErrors.length && !previewRows.some((row) => row.errors.length)) return setMessage('No invalid rows to report.');
    try {
      await exportImportReport(buildImportErrorReport(previewRows, fileErrors));
    } catch {
      setError('Could not prepare the import error report.');
    }
  }

  async function pickCsvFile() {
    if (importLock.current) return;
    importLock.current = true;
    setImportBusy(true);
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
      if (content.length > 500000) return setError('CSV exceeds the 500000 character limit.');
      clearPreview();
      setCsvFileName(asset.name || 'Selected CSV');
      setCsvText(content);
      setPreviewRows([]);
      setValidRows([]);
      setPreviewMessage('CSV loaded. Preview it before importing.');
    } catch {
      setError('Could not read the selected CSV file. Try a plain UTF-8 .csv file.');
    } finally {
      importLock.current = false;
      setImportBusy(false);
    }
  }

  if (user?.role !== 'ADMIN' && !(user?.role === 'STAFF' && user.permissions?.includes(sectionPermission[section]))) {
    return <ThemedView style={authStyles.panel}>
      <ThemedText>Only Admin and Staff with the assigned permission can open this workspace.</ThemedText>
      {onBack && <AuthButton label="Back to dashboard" onPress={onBack} variant="secondary" />}
    </ThemedView>;
  }
  return (
    <ThemedView style={authStyles.panel}>
      {onBack && <AuthButton label="Back to dashboard" onPress={onBack} variant="secondary" />}
      <ThemedView style={authStyles.panelHeader}>
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

      {section !== 'books' && section !== 'paper' && (
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
        {user?.role === 'ADMIN' && <View style={{ gap: Spacing.three }}>
        <AuthTextField label="Book title" placeholder="Physics 1st Paper" value={bookForm.title} onChangeText={(title) => setBookForm((current) => ({ ...current, title }))} />
        <AuthTextField label="Subject" placeholder="Physics" value={bookForm.subject} onChangeText={(subject) => setBookForm((current) => ({ ...current, subject }))} />
        <View style={authStyles.row}>
          <View style={examStyles.flexField}>
            <AuthTextField label="Class" placeholder="HSC" value={bookForm.className} onChangeText={(className) => setBookForm((current) => ({ ...current, className }))} />
          </View>
          <View style={examStyles.flexField}>
<ThemedText type="smallBold">Eligible book groups</ThemedText>
            {academicGroups.map((group) => <AuthButton key={group.value} label={(bookEligibleGroups.includes(group.value) ? '✓ ' : '') + group.label} variant="secondary" onPress={() => setBookEligibleGroups((current) => current.includes(group.value) ? current.filter((item) => item !== group.value) : [...current, group.value])} />)}
          </View>
        </View>
        <AuthButton label="Create book" onPress={createBook} />
        </View>}
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
        <ThemedText type="caption" style={authStyles.mutedText}>
          Create the matching book and chapters first. Select a CSV file or paste rows. Maximum 50 MCQs per import. correctOption must be A/B/C/D and difficulty must be easy/medium/hard.
        </ThemedText>
        <View style={examStyles.importToolbar}>
          <View style={examStyles.importFileCopy}>
            <ThemedText type="caption" style={authStyles.mutedText}>Selected file</ThemedText>
            <ThemedText type="smallBold">{csvFileName}</ThemedText>
          </View>
          <AuthButton label="Select CSV" onPress={pickCsvFile} variant="secondary" />
        </View>
        <TextInput
          editable={!importBusy}
          accessibilityLabel="CSV import text"
          multiline
          value={csvText}
          onChangeText={(text) => {
            setCsvText(text);
            setCsvFileName('Pasted CSV');
            clearPreview();
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
          <View style={examStyles.flexField}><AuthButton label={importBusy ? 'Checking...' : 'Preview CSV'} disabled={importBusy} onPress={previewCsv} variant="secondary" /></View>
          <View style={examStyles.flexField}><AuthButton label={importBusy ? 'Saving...' : 'Import valid rows'} disabled={importBusy || !!fileErrors.length || !validRows.length} onPress={commitCsv} /></View>
        </View>
        {!!previewRows.length && (
          <View style={authStyles.row}>
            <View style={examStyles.flexField}><AuthButton label="Remove duplicate rows" disabled={importBusy || !!fileErrors.length} onPress={removeDuplicatePreviewRows} variant="secondary" /></View>
            <View style={examStyles.flexField}><AuthButton label="Share error report" onPress={shareImportErrorReport} variant="secondary" /></View>
            <View style={examStyles.flexField}><AuthButton label="Clear preview" onPress={() => { if (!importLock.current) clearPreview(); }} variant="secondary" /></View>
          </View>
        )}
        {importBusy && <ActivityIndicator />}
        <ImportSuccessModal
          admin={user?.role === 'ADMIN'}
          visible={showImportReceipt}
          summary={importSummary}
          onClose={() => setShowImportReceipt(false)}
          onBuildPaper={() => {
            setPaperSource(importedPaperSource(importSummary?.questions || [], selectedBookId));
            setShowImportReceipt(false);
            onOpenSection?.('paper');
          }}
        />
        {!previewRows.length && <EmptyState title="Preview before import" body="Select a CSV file, preview validation, then import only clean rows into the question bank." />}
        {!!previewRows.length && <ImportPreviewList rows={previewRows} disabled={importBusy || !!fileErrors.length} onEditRow={openEditRow} onRemoveRow={removePreviewRow} />}
        <ImportRowEditModal
          busy={importBusy}
          row={editingRow}
          form={editForm}
          onChange={setEditForm}
          onCancel={() => {
            setEditingRow(null);
            setEditForm(null);
          }}
          onSave={saveEditedRow}
        />
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
        <QuestionBankWorkspace key={selectedBookId} bookId={selectedBookId} chapters={selectedBookChapters} version={questions} admin={user?.role === 'ADMIN'} onDelete={confirmDeleteQuestion} />
      </ThemedView>}

      {section === 'paper' && <PaperAuthoringWorkspace source={paperSource} />}
    </ThemedView>
  );
}

const sectionHelp: Record<ExamAdminSection, string> = {
  books: 'Create the book/subject container first.',
  chapters: 'Select a book, then create chapters under that book.',
  import: 'Paste CSV rows, preview validation, then import valid questions.',
  question: 'Add one MCQ manually with correct answer and explanation.',
  paper: 'Select questions, schedule availability and publish the exam paper.',
};

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

function ImportPreviewList({ rows, disabled, onEditRow, onRemoveRow }: { rows: ImportPreviewRowDto[]; disabled: boolean; onEditRow: (row: ImportPreviewRowDto) => void; onRemoveRow: (rowNumber: number) => void }) {
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
            <AuthButton label="Edit row" disabled={disabled} onPress={() => onEditRow(row)} variant="secondary" />
            <AuthButton label="Remove row from preview" disabled={disabled} onPress={() => onRemoveRow(row.rowNumber)} variant="secondary" />
          </View>
        );
      })}
    </View>
  );
}

function ImportRowEditModal({ row, form, busy, onChange, onCancel, onSave }: {
  row: ImportPreviewRowDto | null;
  form: ImportRowDto | null;
  busy: boolean;
  onChange: (form: ImportRowDto) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  if (!row || !form) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={() => { if (!busy) onCancel(); }}>
      <View style={examStyles.modalScrim}>
        <View style={[examStyles.successDialog, { maxHeight: '90%' }]}>
          <ThemedText type="sectionTitle">Edit CSV row {row.rowNumber}</ThemedText>
          <ScrollView keyboardShouldPersistTaps="handled">
            {importHeaders.map((field) => (
              <AuthTextField key={field} label={field} placeholder={field} value={form[field] || ''} editable={!busy}
                multiline={field === 'question' || field === 'explanation'}
                onChangeText={(value) => onChange({ ...form, [field]: value })} />
            ))}
          </ScrollView>
          <ThemedText type="caption">Save rechecks mapping, values and duplicates against the question bank.</ThemedText>
          <AuthButton label={busy ? 'Checking...' : 'Save and revalidate'} disabled={busy} onPress={onSave} />
          <AuthButton label="Cancel" disabled={busy} onPress={onCancel} variant="secondary" />
        </View>
      </View>
    </Modal>
  );
}

function ImportSuccessModal({
  admin,
  visible,
  summary,
  onClose,
  onBuildPaper,
}: {
  visible: boolean;
  summary: ImportCommitDto | null;
  onClose: () => void;
  onBuildPaper: () => void;
  admin: boolean;
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
            {admin ? 'Build paper opens these imported questions already selected. Check title, time and marks, then Create and publish exam. No separate approval is required.' : 'Review and approve the bank questions, then create, preview and publish a Question Paper for students.'}
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
