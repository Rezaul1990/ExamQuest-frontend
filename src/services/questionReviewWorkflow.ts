import type { ExamQuestionDto } from '@/models/api/ExamApi';

type Reviewer = (id: string, status: 'reviewed' | 'approved', revision: number) => Promise<{ question: ExamQuestionDto }>;
// Explicit Admin confirmation covers only the captured visible page, not the whole bank.
export async function approveListedQuestions(questions: ExamQuestionDto[], review: Reviewer) {
  const pending = questions.filter((question) => question.status === 'active' && question.reviewStatus !== 'approved');
  let approvedCount = 0;
  for (const source of pending) {
    try {
      let question = source;
      if (question.reviewStatus !== 'reviewed') question = (await review(question.id, 'reviewed', question.revision || 0)).question;
      await review(question.id, 'approved', question.revision || 0);
      approvedCount++;
    } catch (error) {
      return { requestedCount: pending.length, approvedCount, error };
    }
  }
  return { requestedCount: pending.length, approvedCount, error: undefined };
}
