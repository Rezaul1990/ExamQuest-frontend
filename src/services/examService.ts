import type {
  DeleteQuestionPaperDto, PaperPreviewDto, GeneratePaperDto, AcademicGroup, PaperCandidateAvailabilityDto,
  ExamAttemptDto, ExamQuotaDto,
  ExamBookDto,
  ExamChapterDto,
  ExamQuestionDto,
  ImportCommitDto,
  ImportPreviewDto,
  ImportRowDto,
  OptionKey,
  QuestionPaperDto,
  BankFilters, QuestionAnalyticsDto,
} from '@/models/api/ExamApi';
import { apiRequest } from '@/services/apiClient';

function query(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const value = search.toString();
  return value ? `?${value}` : '';
}

export const examService = {
  listAdminBooks() {
    return apiRequest<{ books: ExamBookDto[] }>('/exams/admin/books');
  },
  createBook(payload: { title: string; subject: string; className?: string; group?: string; eligibleGroups?: string[]; status?: string }) {
    return apiRequest<{ book: ExamBookDto }>('/exams/admin/books', { method: 'POST', body: JSON.stringify(payload) });
  },
  listAdminChapters(bookId: string) {
    return apiRequest<{ chapters: ExamChapterDto[] }>(`/exams/admin/books/${bookId}/chapters`);
  },
  createChapter(payload: { bookId: string; title: string; order?: number; status?: string }) {
    return apiRequest<{ chapter: ExamChapterDto }>('/exams/admin/chapters', { method: 'POST', body: JSON.stringify(payload) });
  },
  listAdminQuestions(bookId?: string, chapterId?: string, filters: BankFilters = {}) {
    return apiRequest<{ questions: ExamQuestionDto[] }>(`/exams/admin/questions${query({ ...filters, bookId, chapterId: chapterId || filters.chapterId })}`);
  },
  updateQuestion(id: string, payload: Record<string, unknown>) {
    return apiRequest<{ question: ExamQuestionDto }>(`/exams/admin/questions/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  questionAnalytics(bookId: string, filters: BankFilters = {}) {
    return apiRequest<{ analytics: QuestionAnalyticsDto[] }>(`/exams/admin/question-analytics${query({ ...filters, bookId })}`);
  },
  createQuestion(payload: {
    bookId: string;
    chapterId: string;
    text: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: OptionKey;
    explanation?: string;
    difficulty?: string;
    status?: string;
  }) {
    return apiRequest<{ question: ExamQuestionDto }>('/exams/admin/questions', { method: 'POST', body: JSON.stringify(payload) });
  },
  deleteQuestion(id: string) {
    return apiRequest<{ deletedQuestionId: string }>(`/exams/admin/questions/${id}`, { method: 'DELETE' });
  },
  previewImport(csvText: string, rowNumbers?: number[]) {
    return apiRequest<ImportPreviewDto>('/exams/admin/questions/import/preview', { method: 'POST', body: JSON.stringify({ csvText, rowNumbers }) });
  },
  commitImport(rows: ImportRowDto[], rowNumbers?: number[]) {
    return apiRequest<ImportCommitDto>('/exams/admin/questions/import/commit', {
      method: 'POST',
      body: JSON.stringify({ rows, rowNumbers }),
    });
  },
  listAdminQuestionPapers(bookId?: string, chapterId?: string) {
    return apiRequest<{ questionPapers: QuestionPaperDto[] }>(`/exams/admin/question-papers${query({ bookId, chapterId })}`);
  },
  createQuestionPaper(payload: {
    title: string;
    bookId: string;
    chapterIds: string[];
    eligibleGroups?: string[];
    durationMinutes: number;
    totalMarks: number;
    passMark: number;
    questionIds: string[];
    availableFrom?: string | null;
    availableUntil?: string | null;
    status: string;
  }) {
    return apiRequest<{ questionPaper: QuestionPaperDto }>('/exams/admin/question-papers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  setQuestionPaperStatus(id: string, status: string, revision?: number) {
    return apiRequest<{ questionPaper: QuestionPaperDto }>(`/exams/admin/question-papers/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, revision }),
    });
  },
  deleteQuestionPaper(id: string) {
    return apiRequest<DeleteQuestionPaperDto>(`/exams/admin/question-papers/${id}`, { method: 'DELETE' });
  },
  listPaperCandidates(bookId: string) {
    return apiRequest<{ questions: ExamQuestionDto[]; limit: number; availability?: PaperCandidateAvailabilityDto[] }>('/exams/admin/question-papers/candidates' + query({ bookId }));
  },
  generatePaperQuestions(payload: { bookId: string; chapterIds: string[]; eligibleGroups: AcademicGroup[]; count: number; difficulty?: string; preferFresh: boolean }) {
    return apiRequest<GeneratePaperDto>('/exams/admin/question-papers/generate', { method: 'POST', body: JSON.stringify(payload) });
  },
  previewPaper(id: string) { return apiRequest<PaperPreviewDto>('/exams/admin/question-papers/' + id + '/preview'); },
  updateQuestionPaper(id: string, payload: Record<string, unknown>) { return apiRequest<{ questionPaper: QuestionPaperDto }>('/exams/admin/question-papers/' + id, { method: 'PATCH', body: JSON.stringify(payload) }); },
  reviewPaper(id: string, reviewStatus: 'reviewed' | 'approved', revision: number) {
    return apiRequest<{ questionPaper: QuestionPaperDto }>('/exams/admin/question-papers/' + id + '/review', { method: 'POST', body: JSON.stringify({ reviewStatus, revision }) });
  },
  reviewQuestion(id: string, reviewStatus: 'reviewed' | 'approved', revision: number) {
    return apiRequest<{ question: ExamQuestionDto }>('/exams/admin/questions/' + id + '/review', { method: 'POST', body: JSON.stringify({ reviewStatus, revision }) });
  },
  listBooks() {
    return apiRequest<{ books: ExamBookDto[] }>('/exams/books');
  },
  listChapters(bookId: string) {
    return apiRequest<{ chapters: ExamChapterDto[] }>(`/exams/books/${bookId}/chapters`);
  },
  listQuestionPapers(bookId?: string, chapterId?: string) {
    return apiRequest<{ questionPapers: QuestionPaperDto[] }>(`/exams/question-papers${query({ bookId, chapterId })}`);
  },
  startExam(questionPaperId: string) {
    return apiRequest<{ attempt: ExamAttemptDto; paper: QuestionPaperDto }>(`/exams/question-papers/${questionPaperId}/start`, {
      method: 'POST',
    });
  },
  submitExam(attemptId: string, answers: { questionId: string; selectedOption: OptionKey }[], reason: 'manual' | 'timer_expired' = 'manual') {
    return apiRequest<{ attempt: ExamAttemptDto }>(`/exams/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers, reason }),
    });
  },
  examStatus() { return apiRequest<ExamQuotaDto>('/exams/status'); },
  getAttempt(id: string) { return apiRequest<{ attempt: ExamAttemptDto; paper?: QuestionPaperDto }>('/exams/attempts/' + id); },
  saveAnswers(id: string, answers: { questionId: string; selectedOption: OptionKey }[], revision: number, reviewQuestionIds?: string[]) {
    return apiRequest<{ attempt: ExamAttemptDto }>('/exams/attempts/' + id + '/answers', { method: 'PUT', body: JSON.stringify({ answers, revision, reviewQuestionIds }) });
  },
  listAttempts() {
    return apiRequest<{ attempts: ExamAttemptDto[] }>('/exams/attempts');
  },
};
