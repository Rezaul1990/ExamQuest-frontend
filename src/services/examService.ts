import type {
  ExamAttemptDto,
  ExamBookDto,
  ExamChapterDto,
  ExamQuestionDto,
  ImportPreviewRowDto,
  ImportRowDto,
  OptionKey,
  QuestionPaperDto,
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
  createBook(payload: { title: string; subject: string; className?: string; group?: string; status?: string }) {
    return apiRequest<{ book: ExamBookDto }>('/exams/admin/books', { method: 'POST', body: JSON.stringify(payload) });
  },
  listAdminChapters(bookId: string) {
    return apiRequest<{ chapters: ExamChapterDto[] }>(`/exams/admin/books/${bookId}/chapters`);
  },
  createChapter(payload: { bookId: string; title: string; order?: number; status?: string }) {
    return apiRequest<{ chapter: ExamChapterDto }>('/exams/admin/chapters', { method: 'POST', body: JSON.stringify(payload) });
  },
  listAdminQuestions(bookId?: string, chapterId?: string) {
    return apiRequest<{ questions: ExamQuestionDto[] }>(`/exams/admin/questions${query({ bookId, chapterId })}`);
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
  previewImport(csvText: string) {
    return apiRequest<{ rows: ImportPreviewRowDto[]; validRows: ImportRowDto[]; validCount: number; invalidCount: number }>(
      '/exams/admin/questions/import/preview',
      { method: 'POST', body: JSON.stringify({ csvText }) }
    );
  },
  commitImport(rows: ImportRowDto[]) {
    return apiRequest<{ importedCount: number; questions: ExamQuestionDto[] }>('/exams/admin/questions/import/commit', {
      method: 'POST',
      body: JSON.stringify({ rows }),
    });
  },
  listAdminQuestionPapers(bookId?: string, chapterId?: string) {
    return apiRequest<{ questionPapers: QuestionPaperDto[] }>(`/exams/admin/question-papers${query({ bookId, chapterId })}`);
  },
  createQuestionPaper(payload: {
    title: string;
    bookId: string;
    chapterIds: string[];
    durationMinutes: number;
    totalMarks: number;
    questionIds: string[];
    status: string;
  }) {
    return apiRequest<{ questionPaper: QuestionPaperDto }>('/exams/admin/question-papers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  setQuestionPaperStatus(id: string, status: string) {
    return apiRequest<{ questionPaper: QuestionPaperDto }>(`/exams/admin/question-papers/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
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
  submitExam(attemptId: string, answers: { questionId: string; selectedOption: OptionKey }[]) {
    return apiRequest<{ attempt: ExamAttemptDto }>(`/exams/attempts/${attemptId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },
  listAttempts() {
    return apiRequest<{ attempts: ExamAttemptDto[] }>('/exams/attempts');
  },
};
