import type { AcademicGroup, ExamBookDto, PaperCandidateAvailabilityDto, ExamQuestionDto } from '@/models/api/ExamApi';

export function summarizePaperAvailability(rows: PaperCandidateAvailabilityDto[], chapters: string[], difficulty = '') {
  return rows.filter((row) => chapters.includes(row.chapterId) && (!difficulty || row.difficulty === difficulty))
    .reduce((sum, row) => ({ total: sum.total + row.total, approved: sum.approved + row.approved, pendingReview: sum.pendingReview + row.pendingReview }), { total: 0, approved: 0, pendingReview: 0 });
}
export function paperGenerationBlocker(count: string, approved: number, requiresApproval = true): string | null {
  const requested = Number(count);
  if (!Number.isInteger(requested) || requested < 1 || requested > 200) return 'Enter a whole question count from 1 to 200.';
  if (approved === 0) return requiresApproval ? 'Approve questions before generating. No approved questions match the current chapters and difficulty.' : 'No active questions match. Choose Any difficulty or import questions into these chapters.';
  if (requested > approved) return `Requested ${requested}, but only ${approved}${requiresApproval ? ' approved' : ''} questions match. Reduce the count or choose Any difficulty.`;
  return null;
}

export type PaperSelection = { className: string; groups: AcademicGroup[]; subject: string; bookId: string; chapterIds: string[]; questionIds: string[] };
export type ImportedPaperSource = { bookId: string; chapterIds: string[]; questionIds: string[] };
export function importedPaperSource(questions: Pick<ExamQuestionDto, 'id' | 'bookId' | 'chapterId'>[], preferredBookId?: string): ImportedPaperSource | undefined {
  const bookId = questions.some((question) => question.bookId === preferredBookId) ? preferredBookId : questions[0]?.bookId;
  if (!bookId) return undefined;
  const matching = questions.filter((question) => question.bookId === bookId);
  return { bookId, chapterIds: [...new Set(matching.map((question) => question.chapterId))], questionIds: [...new Set(matching.map((question) => question.id))] };
}
export const emptyPaperSelection: PaperSelection = { className: '', groups: [], subject: '', bookId: '', chapterIds: [], questionIds: [] };
export const bookGroups = (book: ExamBookDto): AcademicGroup[] => book.eligibleGroups?.length ? book.eligibleGroups : book.group ? [book.group] : [];
export function paperDraftBlocker(selection: PaperSelection, title: string, availableCount: number, admin = false): string | null {
  if (!selection.bookId || !selection.groups.length) return 'Select class, audience groups, subject and book first.';
  if (!selection.chapterIds.length) return 'Select at least one chapter first.';
  if (!availableCount && !selection.questionIds.length) return admin ? 'No active questions match. Choose Any difficulty or import questions for the selected chapters.' : 'No approved questions match this selection. Imported questions start as draft: review and approve them in the question bank, then reload the selection.';
  if (!selection.questionIds.length) return 'Select questions manually or use Generate selection before saving.';
  if (!title.trim()) return 'Enter a paper title before saving.';
  return null;
}
export function eligibleBooks(books: ExamBookDto[], selection: PaperSelection) {
  return books.filter((book) => book.status !== 'archived' && book.className === selection.className && selection.groups.length > 0 && selection.groups.every((group) => bookGroups(book).includes(group)) && (!selection.subject || book.subject === selection.subject));
}
export function changePaperSelection(current: PaperSelection, field: 'className' | 'groups' | 'subject' | 'bookId', value: string | AcademicGroup[]): PaperSelection {
  if (field === 'className') return { ...emptyPaperSelection, className: value as string };
  if (field === 'groups') return { ...current, groups: value as AcademicGroup[], subject: '', bookId: '', chapterIds: [], questionIds: [] };
  if (field === 'subject') return { ...current, subject: value as string, bookId: '', chapterIds: [], questionIds: [] };
  return { ...current, bookId: value as string, chapterIds: [], questionIds: [] };
}
