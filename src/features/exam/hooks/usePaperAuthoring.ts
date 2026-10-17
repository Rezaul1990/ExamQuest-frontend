import { useEffect, useRef, useState } from 'react';
import type { AcademicGroup, ExamBookDto, ExamChapterDto, ExamQuestionDto, PaperPreviewDto, QuestionPaperDto, PaperCandidateAvailabilityDto } from '@/models/api/ExamApi';
import { examService } from '@/services/examService';
import { ApiError, getApiErrorMessage } from '@/services/apiClient';
import { bookGroups, changePaperSelection, eligibleBooks, emptyPaperSelection, summarizePaperAvailability, paperGenerationBlocker, type PaperSelection, type ImportedPaperSource } from '../paperAuthoring.helpers';
import { useAuth } from '@/store';

const emptyForm = { title: '', durationMinutes: '20', totalMarks: '20', passMark: '8', availableFrom: '', availableUntil: '' };
const toggle = <T,>(values: T[], value: T) => values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
export function usePaperAuthoring(source?: ImportedPaperSource) {
  const isAdmin = useAuth((state) => state.user?.role === 'ADMIN');
  const [books, setBooks] = useState<ExamBookDto[]>([]);
  const [chapters, setChapters] = useState<ExamChapterDto[]>([]);
  const [questions, setQuestions] = useState<ExamQuestionDto[]>([]);
  const [availability, setAvailability] = useState<PaperCandidateAvailabilityDto[] | null>(null);
  const [papers, setPapers] = useState<QuestionPaperDto[]>([]);
  const [selection, setSelection] = useState<PaperSelection>(emptyPaperSelection);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<QuestionPaperDto | null>(null);
  const [preview, setPreview] = useState<PaperPreviewDto | null>(null);
  const [publishedPaper, setPublishedPaper] = useState<QuestionPaperDto | null>(null);
  const [difficulty, setDifficulty] = useState('');
  const [count, setCount] = useState('20');
  const [preferFresh, setPreferFresh] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const lock = useRef(false);

  async function refresh() {
    setLoading(true); setError(null);
    try {
      const [catalog, list] = await Promise.all([examService.listAdminBooks(), examService.listAdminQuestionPapers()]);
      setBooks(catalog.books); setPapers(list.questionPapers);
      if (selection.bookId) {
        const [chapterData, candidateData] = await Promise.all([examService.listAdminChapters(selection.bookId), examService.listPaperCandidates(selection.bookId)]);
        setChapters(chapterData.chapters.filter((chapter) => chapter.status !== 'archived')); setQuestions(candidateData.questions);
        setAvailability(candidateData.availability || null);
        // A bank edit resets approval; do not retain unavailable selected IDs.
        setSelection((current) => current.bookId !== selection.bookId ? current : { ...current, questionIds: current.questionIds.filter((id) => candidateData.questions.some((question) => question.id === id)) });
      }
    } catch (cause) { setError(getApiErrorMessage(cause)); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    Promise.all([examService.listAdminBooks(), examService.listAdminQuestionPapers()])
      .then(([catalog, list]) => { if (active) {
        setBooks(catalog.books); setPapers(list.questionPapers);
        const book = source && catalog.books.find((item) => item.id === source.bookId);
        if (book && source) {
          setSelection({ className: book.className || '', groups: bookGroups(book), subject: book.subject, bookId: book.id, chapterIds: source.chapterIds, questionIds: source.questionIds });
          if (source.questionIds.length) {
            setCount(String(source.questionIds.length));
            setForm({ ...emptyForm, title: `${book.title} Test`, totalMarks: String(source.questionIds.length), passMark: String(Math.ceil(source.questionIds.length * 0.4)) });
          }
        }
      } })
      .catch((cause) => { if (active) setError(getApiErrorMessage(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [source]);
  useEffect(() => {
    let active = true;
    if (!selection.bookId) return;
    // A book change starts a cancellable server request; stale responses are ignored.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true); setError(null);
    Promise.all([examService.listAdminChapters(selection.bookId), examService.listPaperCandidates(selection.bookId)])
      .then(([chapterData, questionData]) => { if (active) {
        setChapters(chapterData.chapters.filter((chapter) => chapter.status !== 'archived')); setQuestions(questionData.questions);
        setAvailability(questionData.availability || null);
        setSelection((current) => ({ ...current, questionIds: current.questionIds.filter((id) => questionData.questions.some((question) => question.id === id)) }));
        if (questionData.questions.length === questionData.limit) setMessage('Manual list shows up to 1000 approved questions; automatic selection checks the full bank.');
      } })
      .catch((cause) => { if (active) { setError(getApiErrorMessage(cause)); setQuestions([]); setChapters([]); setAvailability(null); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selection.bookId]);

  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(null); setMessage('');
    try { await action(); } catch (cause) { setError(cause instanceof Error && !(cause instanceof ApiError) && !(cause instanceof TypeError) ? cause.message : getApiErrorMessage(cause)); }
    finally { lock.current = false; setBusy(false); }
  }
  function changeFilter(field: 'className' | 'groups' | 'subject' | 'bookId', value: string | AcademicGroup[]) {
    setSelection((current) => changePaperSelection(current, field, value));
    setChapters([]); setQuestions([]); setAvailability(null); setPreview(null); setMessage('');
  }
  function changeForm(field: keyof typeof emptyForm, value: string) { setForm((current) => ({ ...current, [field]: value })); setPreview(null); }
  function reset() { setSelection(emptyPaperSelection); setForm(emptyForm); setEditing(null); setPreview(null); setPublishedPaper(null); setChapters([]); setQuestions([]); setAvailability(null); setMessage(''); setError(null); }
  function toggleChapter(id: string) {
    const chapterIds = toggle(selection.chapterIds, id);
    const matching = questions.filter((question) => chapterIds.includes(question.chapterId) && (!difficulty || question.difficulty === difficulty));
    const questionIds = isAdmin && matching.length <= 200 ? matching.map((question) => question.id) : [];
    setSelection((current) => ({ ...current, chapterIds, questionIds }));
    if (questionIds.length) setCount(String(questionIds.length));
    setPreview(null);
  }
  function toggleQuestion(id: string) { setSelection((current) => ({ ...current, questionIds: toggle(current.questionIds, id) })); setPreview(null); }
  async function generate() { await run(async () => {
    if (!selection.bookId || !selection.groups.length || !selection.chapterIds.length) throw new Error('Select class, audience groups, subject, book and chapters first.');
    if (!Number.isInteger(Number(count)) || Number(count) < 1 || Number(count) > 200) throw new Error('Question count must be 1–200.');
    const result = await examService.generatePaperQuestions({ bookId: selection.bookId, chapterIds: selection.chapterIds, eligibleGroups: selection.groups, count: Number(count), difficulty: difficulty || undefined, preferFresh });
    setMessage(`Available ${result.availableCount}; requested ${result.requestedCount}; shortage ${result.shortageCount}; reused ${result.reusedCount}.${result.shortageCount ? ' Previous selection is retained; reduce the count or change filters.' : ''}`);
    if (!result.shortageCount) { setSelection((current) => ({ ...current, questionIds: result.questionIds })); setPreview(null); }
  }); }
  async function save(forMembers = false) { await run(async () => {
    if (!form.title.trim() || !selection.bookId || !selection.groups.length || !selection.chapterIds.length || !selection.questionIds.length) throw new Error('Add a title and select the academic audience, chapters and questions.');
    if (![form.durationMinutes, form.totalMarks, form.passMark].every((value) => Number.isInteger(Number(value)) && Number(value) > 0)) throw new Error('Duration, marks and pass mark must be positive whole numbers.');
    if (Number(form.passMark) > Number(form.totalMarks)) throw new Error('Pass mark must not exceed total marks.');
    for (const date of [form.availableFrom, form.availableUntil]) if (date && !Number.isFinite(Date.parse(date))) throw new Error('Use a valid ISO date/time with timezone, for example +06:00.');
    const publishNow = isAdmin && forMembers;
    const payload = { ...form, durationMinutes: Number(form.durationMinutes), totalMarks: Number(form.totalMarks), passMark: Number(form.passMark), availableFrom: form.availableFrom || null, availableUntil: form.availableUntil || null, bookId: selection.bookId, chapterIds: selection.chapterIds, eligibleGroups: selection.groups, questionIds: selection.questionIds, status: publishNow && !editing ? 'published' : 'draft' };
    let result = editing ? await examService.updateQuestionPaper(editing.id, { ...payload, revision: editing.revision }) : await examService.createQuestionPaper(payload);
    setEditing(result.questionPaper);
    if (publishNow && editing) result = await examService.setQuestionPaperStatus(result.questionPaper.id, 'published', result.questionPaper.revision);
    setEditing(publishNow ? null : result.questionPaper);
    if (publishNow) setPublishedPaper(result.questionPaper);
    setMessage(publishNow ? 'Exam created and published for eligible members.' : 'Draft saved. Publish when ready to make it available to members.');
    await refresh();
    if (publishNow) { setSelection(emptyPaperSelection); setForm(emptyForm); setChapters([]); setQuestions([]); setAvailability(null); }
    try { setPreview(await examService.previewPaper(result.questionPaper.id)); }
    catch { setError('The paper was saved, but its preview could not load. Reload saved papers to inspect it.'); }
  }); }
  async function openPreview(paper: QuestionPaperDto) { await run(async () => { setPreview(await examService.previewPaper(paper.id)); }); }
  async function editDraft(paper: QuestionPaperDto) { await run(async () => {
    const result = await examService.previewPaper(paper.id);
    const candidateData = await examService.listPaperCandidates(paper.bookId);
    const eligibleIds = new Set(candidateData.questions.map((q) => q.id));
    const book = books.find((item) => item.id === paper.bookId);
    if (!book) throw new Error('Book is unavailable. Reload the workspace.');
    setPublishedPaper(null); setEditing(paper); setForm({ title: paper.title, durationMinutes: String(paper.durationMinutes), totalMarks: String(paper.totalMarks), passMark: String(paper.passMark), availableFrom: paper.availableFrom || '', availableUntil: paper.availableUntil || '' });
    setSelection({ className: book.className || '', groups: paper.eligibleGroups, subject: book.subject, bookId: book.id, chapterIds: paper.chapterIds, questionIds: result.questions.filter((q) => eligibleIds.has(q.id)).map((q) => q.id) });
    setPreview(null); setDifficulty(''); setMessage(isAdmin ? 'Editing draft. Update settings and publish directly when ready.' : 'Editing draft. Unavailable or unapproved questions were excluded. Saving changes resets its review.');
  }); }
  async function review(status: 'reviewed' | 'approved') { if (!preview) return; await run(async () => {
    const result = await examService.reviewPaper(preview.questionPaper.id, status, preview.questionPaper.revision);
    setPreview(await examService.previewPaper(result.questionPaper.id));
    if (editing?.id === result.questionPaper.id) setEditing(result.questionPaper);
    await refresh();
  }); }
  async function publish() { if (!preview) return; await run(async () => {
    const result = await examService.setQuestionPaperStatus(preview.questionPaper.id, 'published', preview.questionPaper.revision);
    setPublishedPaper(result.questionPaper); setEditing(null);
    // Publication is confirmed even if the subsequent preview request fails.
    setPreview((current) => current ? { ...current, questionPaper: result.questionPaper } : null);
    setMessage('Exam published for eligible members.'); await refresh();
    setSelection(emptyPaperSelection); setForm(emptyForm); setChapters([]); setQuestions([]); setAvailability(null);
    try { setPreview(await examService.previewPaper(result.questionPaper.id)); }
    catch { setError('The exam was published successfully, but its preview could not load. Reload saved papers to inspect it.'); }
  }); }
  async function archive(paper: QuestionPaperDto) { await run(async () => {
    await examService.deleteQuestionPaper(paper.id);
    if (publishedPaper?.id === paper.id) setPublishedPaper(null);
    if (preview?.questionPaper.id === paper.id) setPreview(null);
    if (editing?.id === paper.id) reset();
    await refresh(); setMessage('Paper archived. History and bank questions are retained; this category and title can be reused.');
  }); }
  const classBooks = books.filter((book) => book.className === selection.className && book.status !== 'archived');
  const matchingAvailability = availability && summarizePaperAvailability(availability, selection.chapterIds, difficulty);
  const allAvailability = availability && summarizePaperAvailability(availability, selection.chapterIds);
  function selectAllQuestions() {
    const matching = questions.filter((question) => selection.chapterIds.includes(question.chapterId));
    if (!matching.length || matching.length > 200 || (allAvailability && matching.length !== (isAdmin ? allAvailability.total : allAvailability.approved))) return;
    setDifficulty(''); setCount(String(matching.length)); setSelection((current) => ({ ...current, questionIds: matching.map((question) => question.id) }));
    setPreview(null); setMessage(`${matching.length} questions selected across all difficulties. Enter your paper title/settings, then create the exam.`);
  }
  return { books, chapters, questions, papers, selection, form, editing, preview, publishedPaper, difficulty, count, preferFresh, busy, loading, error, message,
    isAdmin, matchingAvailability, allAvailability, selectableCount: allAvailability ? (isAdmin ? allAvailability.total : allAvailability.approved) : 0, generationBlocker: matchingAvailability ? paperGenerationBlocker(count, isAdmin ? matchingAvailability.total : matchingAvailability.approved, !isAdmin) : null, selectAllQuestions,
    classNames: [...new Set(books.filter((book) => book.status !== 'archived').map((book) => book.className).filter((name): name is string => !!name))],
    groups: [...new Set(classBooks.flatMap(bookGroups))],
    subjects: [...new Set(eligibleBooks(books, { ...selection, subject: '' }).map((book) => book.subject))],
    matchingBooks: eligibleBooks(books, selection).filter((book) => !!selection.subject && book.subject === selection.subject),
    visibleQuestions: questions.filter((q) => selection.chapterIds.includes(q.chapterId) && (!difficulty || q.difficulty === difficulty)),
    changeFilter, changeForm, toggleChapter, toggleQuestion, generate, save, openPreview, editDraft, review, publish, archive, refresh, reset,
    closePreview: () => setPreview(null), setCount, setPreferFresh,
    changeDifficulty: (value: string) => { setDifficulty(value); setSelection((current) => ({ ...current, questionIds: [] })); setPreview(null); },
  };
}
