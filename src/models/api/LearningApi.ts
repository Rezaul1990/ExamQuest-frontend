import type { OptionKey, QuestionPaperDto, StudentQuestionDto } from './ExamApi';

export type ReviewQuestionDto = StudentQuestionDto & {
  chapterId: string | null; paperId: string; selectedOption?: OptionKey; correctOption: OptionKey;
  isCorrect: boolean; marksAwarded: number; explanation: string; bookmarked: boolean;
};
export type ResultReviewDto = { available: boolean; releaseAt: string | null; message: string; questions: ReviewQuestionDto[] };
export type PracticeQuestionDto = ReviewQuestionDto & { attemptId: string };
export type LearningOverviewDto = {
  window: number; submissionCount: number; practiceTotal: number; practiceLimit: number;
  trend: { attemptId: string; title: string; percentage: number; submittedAt: string }[];
  chapters: { id: string; bookTitle: string; chapterId: string | null; chapterTitle: string; total: number; answered: number; correct: number; accuracy: number }[];
  practice: PracticeQuestionDto[];
};
export type DiscoveryPaperDto = QuestionPaperDto & { reminded: boolean; upcoming: boolean };
export type DiscoveryDto = { serverNow: string; papers: DiscoveryPaperDto[] };
export type QuestionReportCategory = 'wrong_answer' | 'unclear' | 'typo' | 'other';
export type QuestionReportDto = { id: string; category: QuestionReportCategory; detail: string; status: 'open' | 'resolved' | 'dismissed'; resolution?: string; createdAt: string; paperTitle: string; questionId: string; questionText: string };
