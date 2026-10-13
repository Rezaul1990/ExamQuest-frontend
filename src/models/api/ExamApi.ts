export type ContentStatus = 'draft' | 'published' | 'archived';
export type QuestionStatus = 'active' | 'inactive';
export type OptionKey = 'A' | 'B' | 'C' | 'D';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type ExamBookDto = {
  id: string;
  title: string;
  subject: string;
  className?: string;
  group?: string;
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
  id: string;
  title: string;
  bookId: string;
  chapterIds: string[];
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
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
  group?: string;
};

export type ImportPreviewRowDto = {
  rowNumber: number;
  data: ImportRowDto;
  errors: string[];
};

export type ExamAttemptDto = {
  id: string;
  questionPaperId: string;
  paperTitle?: string;
  questions?: ExamQuestionDto[];
  answers: {
    questionId: string;
    selectedOption?: OptionKey;
    correctOption?: OptionKey;
    isCorrect: boolean;
    marksAwarded: number;
  }[];
  score: number;
  total: number;
  percentage: number;
  status: 'in_progress' | 'submitted';
  startedAt: string;
  submittedAt?: string;
};
