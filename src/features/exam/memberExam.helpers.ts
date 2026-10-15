import type { ExamAttemptDto, OptionKey } from '@/models/api/ExamApi';
export function answersFromAttempt(attempt: ExamAttemptDto): Record<string, OptionKey> {
  return Object.fromEntries(attempt.answers.filter((answer) => answer.selectedOption).map((answer) => [answer.questionId, answer.selectedOption!])) as Record<string, OptionKey>;
}
export function remainingSeconds(expiresAt: string | undefined, serverAnchor: number, elapsedMilliseconds: number) {
  return expiresAt ? Math.max(0, Math.ceil((Date.parse(expiresAt) - serverAnchor - Math.max(0, elapsedMilliseconds)) / 1000)) : 0;
}
export function countdownLabel(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
