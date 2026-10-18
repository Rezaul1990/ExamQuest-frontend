export type ReviewStatus = 'draft' | 'reviewed' | 'approved';
export type ContentStatus = 'draft' | 'published' | 'archived';
export type QuestionStatus = 'active' | 'inactive';
export type OptionKey = 'A' | 'B' | 'C' | 'D';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type AcademicGroup = 'Science' | 'Humanities' | 'BusinessStudies';

export type ExamBookDto = {
  id: string;
  title: string;
  subject: string;
  className?: string;
  group?: AcademicGroup;
  eligibleGroups?: AcademicGroup[];
  status: ContentStatus;
};

export type ExamChapterDto = {
  id: string;
  bookId: string;
  title: string;
  order: number;
  status: ContentStatus;
};

export type ExamQuestionDto = {
  paperCount?: number;
  reviewStatus?: ReviewStatus;
  revision?: number;
  id: string;
  bookId: string;
  chapterId: string;
  text: string;
  options: { key: OptionKey; text: string }[];
  correctOption?: OptionKey;
  explanation?: string;
  difficulty: Difficulty;
  status: QuestionStatus;
};

export type QuestionPaperDto = {
  resultsReleaseScheduledAt?: string;
  reviewStatus: ReviewStatus;
  revision: number;
  snapshotVersion?: number;
  availabilityStatus?: string;
  id: string;
  title: string;
  bookId: string;
  subject?: string;
  className?: string;
  group?: AcademicGroup;
  chapterIds: string[];
  eligibleGroups: AcademicGroup[];
  durationMinutes: number;
  totalMarks: number;
  passMark: number;
  questionCount: number;
  availableFrom?: string;
  availableUntil?: string;
  status: ContentStatus;
};

export type ImportRowDto = {
  book: string;
  chapter: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: OptionKey;
  explanation?: string;
  difficulty?: Difficulty;
  subject?: string;
  className?: string;
  group?: AcademicGroup;
};

export type ImportPreviewRowDto = {
  rowNumber: number;
  data: ImportRowDto;
  errors: string[];
  duplicate?: boolean;
  existingQuestionId?: string;
};

export type ImportPreviewDto = {
  rows: ImportPreviewRowDto[];
  validRows: ImportRowDto[];
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  errors?: string[];
};

export type ImportCommitDto = {
  errors?: string[];
  importedCount: number;
  skippedDuplicateCount: number;
  invalidCount: number;
  rows: ImportPreviewRowDto[];
  skippedRows?: { rowNumber: number; data: ImportRowDto; reason: string }[];
  questions: ExamQuestionDto[];
  summary: string;
};

export type StudentQuestionDto = Omit<ExamQuestionDto, 'chapterId' | 'status' | 'correctOption' | 'explanation' | 'options'> & { options: { key: OptionKey; label?: string; text: string }[] };
export type BankFilters = { chapterId?: string; q?: string; difficulty?: string; status?: string; reviewStatus?: string; page?: string; limit?: string };
export type PaperCandidateAvailabilityDto = { chapterId: string; difficulty: string; total: number; approved: number; pendingReview: number };
export type QuestionAnalyticsDto = { questionId: string; difficulty: Difficulty; paperCount: number; submissions: number; answered: number; correct: number; correctnessPercent: number | null };
export type ExamAttemptDto = {
  reviewQuestionIds?: string[];
  reviewAvailable?: boolean;
  id: string;
  questionPaperId: string;
  paperTitle?: string;
  questions?: StudentQuestionDto[];
  answers: {
    questionId: string;
    selectedOption?: OptionKey;
    correctOption?: OptionKey;
    isCorrect?: boolean;
    marksAwarded?: number;
  }[];
  score: number;
  total: number;
  percentage: number;
  status: 'in_progress' | 'submitted' | 'expired';
  expiresAt?: string;
  serverNow?: string;
  answerRevision?: number;
  submissionMode?: 'manual' | 'timer_expired';
  expiryReason?: string;
  startedAt: string;
  submittedAt?: string;
};

export type DeleteQuestionPaperDto = {
  deletedMode: 'deleted' | 'archived';
  questionPaperId?: string;
  questionPaper?: QuestionPaperDto;
  attemptCount: number;
};

export type PaperPreviewDto = { questionPaper: QuestionPaperDto; questions: (Omit<ExamQuestionDto, 'chapterId' | 'status'> & { marks: number })[]; warnings: string[] };
export type GeneratePaperDto = { questionIds: string[]; availableCount: number; requestedCount: number; shortageCount: number; reusedCount: number };

export type ExamQuotaDto = { dayKey: string; timeZone: 'Asia/Dhaka'; limit: number; used: number; canSubmit: boolean; resetsAt: string; serverNow: string };
