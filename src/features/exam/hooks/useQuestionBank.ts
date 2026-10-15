import { useCallback, useEffect, useRef, useState } from 'react';
import type { BankFilters, ExamQuestionDto, QuestionAnalyticsDto } from '@/models/api/ExamApi';
import { examService } from '@/services/examService';
import { getApiErrorMessage } from '@/services/apiClient';
import { approveListedQuestions } from '@/services/questionReviewWorkflow';

export function useQuestionBank(bookId: string, version: ExamQuestionDto[], admin: boolean) {
  const [filters, setFilters] = useState<BankFilters>({});
  const [page, setPage] = useState(1);
  const [questions, setQuestions] = useState<ExamQuestionDto[]>([]);
  const [analytics, setAnalytics] = useState<QuestionAnalyticsDto[] | null>(null);
  const [loading, setLoading] = useState(false), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [message, setMessage] = useState('');
  const [reload, setReload] = useState(0);
  const sequence = useRef(0), mutation = useRef(false);
  useEffect(() => {
    sequence.current++;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      setQuestions([]); setAnalytics(null); setError(''); setLoading(!!bookId);
    });
    const timer = setTimeout(() => {
      if (!bookId) return;
      examService.listAdminQuestions(bookId, undefined, { ...filters, page: String(page), limit: '50' })
        .then((result) => { if (!cancelled) setQuestions(result.questions); })
        .catch((cause) => { if (!cancelled) setError(getApiErrorMessage(cause)); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [bookId, filters, page, version, reload]);
  const filter = (key: keyof BankFilters, value: string) => { setPage(1); setFilters((current) => ({ ...current, [key]: value || undefined })); };
  const act = useCallback(async (work: () => Promise<unknown>, success: string) => {
    if (mutation.current) return false;
    mutation.current = true; setBusy(true); setError(''); setMessage('');
    try { await work(); setMessage(success); setReload((n) => n + 1); return true; }
    catch (cause) { setError(getApiErrorMessage(cause)); return false; }
    finally { mutation.current = false; setBusy(false); }
  }, []);
  async function loadAnalytics() {
    if (!admin || loading || busy) return;
    const id = sequence.current;
    setBusy(true); setError('');
    try {
      const result = await examService.questionAnalytics(bookId, { ...filters, page: String(page), limit: '50' });
      if (sequence.current === id) setAnalytics(result.analytics);
    } catch (cause) { if (sequence.current === id) setError(getApiErrorMessage(cause)); }
    finally { setBusy(false); }
  }
  async function approvePage(rows: ExamQuestionDto[]) {
    if (!admin || mutation.current) return;
    mutation.current = true; setBusy(true); setError(''); setMessage('Approving listed questions...');
    try {
      const result = await approveListedQuestions(rows, examService.reviewQuestion);
      setMessage(`${result.approvedCount}/${result.requestedCount} listed questions approved. Return to the paper to generate a selection.`);
      if (result.error) setError(`Stopped after ${result.approvedCount} approvals. Already accepted approvals are kept. Reload and review remaining questions before retrying. ${getApiErrorMessage(result.error)}`);
    } finally { setReload((n) => n + 1); mutation.current = false; setBusy(false); }
  }
  return { questions, filters, filter, page, setPage, analytics, loadAnalytics, loading, busy, error, message, act, approvePage, refresh: () => setReload((n) => n + 1) };
}
