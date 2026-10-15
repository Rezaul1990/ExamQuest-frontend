import { Config } from '@/constants/Config';
import type { ApiEnvelope, AuthResponseDto } from '@/models/api/AuthApi';
import { clearRefreshToken, getRefreshToken, saveRefreshToken } from '@/services/tokenStorage';

let accessToken: string | null = null;
let refreshPromise: Promise<AuthResponseDto | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

type RequestOptions = RequestInit & {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: ApiEnvelope<unknown>['details'];

  constructor(status: number, envelope: ApiEnvelope<unknown>) {
    super(envelope.error || envelope.message || 'Request failed');
    this.status = status;
    this.code = envelope.error;
    this.details = envelope.details;
  }
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.details?.length) {
      return error.details.map((detail) => `${detail.path}: ${detail.message}`).join('\n');
    }
    if (error.code === 'INVALID_CREDENTIALS') {
      return 'Invalid email or password.';
    }
    if (error.code === 'ACCOUNT_NOT_ACTIVE') {
      return 'Account is not active yet. Verify email first, or contact admin if suspended.';
    }
    if (error.code === 'EMAIL_ALREADY_REGISTERED') {
      return 'This email is already registered. Try login or forgot password.';
    }
    if (error.code === 'RATE_LIMITED') {
      return 'Too many attempts. Please wait and try again.';
    }
    if (error.code === 'EXAM_ALREADY_SUBMITTED') {
      return 'You have already submitted this exam. Check Result history for your score.';
    }
    if (error.code === 'QUESTION_PAPER_NOT_OPEN') {
      return 'This question paper is not open right now.';
    }
    if (error.code === 'QUESTION_IN_USE') {
      return 'This question is already used in a question paper. Delete that paper first, then delete/import this question.';
    }
    if (error.code === 'MEMBER_PROFILE_INCOMPLETE') {
      return 'Complete class, group and academic year before taking group-restricted exams.';
    }
    if (error.code === 'QUESTION_PAPER_NOT_ELIGIBLE') {
      return 'This question paper is not available for your class or group.';
    }
    const authoringErrors: Record<string, string> = {
      SUBMISSION_UNCONFIRMED: 'Submission could not be confirmed. Retry this same attempt; an accepted result will be returned without using another daily allowance.',
      DAILY_SUBMISSION_LIMIT: 'You have already submitted an exam today (Asia/Dhaka). You can submit another tomorrow.',
      ATTEMPT_EXPIRED: 'This attempt has expired. Check its result or start a fresh attempt when eligible.',
      ATTEMPT_NOT_EXPIRED: 'The server timer is still running. Refresh this attempt to sync the countdown.',
      ATTEMPT_CHANGED_RELOAD: 'Answers changed in another session. Reload the saved answers before continuing.',
      INVALID_ATTEMPT_ANSWERS: 'Answers must belong to this attempt, with one choice per question.',
      EXAM_STORAGE_NOT_READY: 'Exam submissions are temporarily unavailable. Your daily allowance has not been reserved. Try again shortly.',
      MEMBER_ACCESS_REQUIRED: 'This exam area is available to member accounts only.',
      LEGACY_PAPER_SNAPSHOT_REQUIRED: 'A referenced older paper has missing questions. Restore its bank references before changing or deleting this question.',
      PAPER_TITLE_ALREADY_EXISTS: 'A paper with this title already exists for this book. Choose another title or archive the existing paper.',
      RESOURCE_SCOPE_FORBIDDEN: 'This book or paper is outside your assigned access. Ask Admin to update your book access.',
      PAPER_GROUP_MAPPING_INVALID: 'Select audience groups explicitly allowed by this book.',
      BOOK_ACADEMIC_MAPPING_REQUIRED: 'The book needs a class and eligible groups before creating papers.',
      QUESTION_APPROVAL_REQUIRED: 'Review and approve all selected bank questions before saving or publishing.',
      QUESTION_CHAPTER_MISMATCH: 'Selected questions must belong to the chosen book and chapters.',
      PAPER_REVIEW_REQUIRED: 'Save a draft, preview it, mark it reviewed and approve it before publishing.',
      PAPER_CONTENT_CHANGED_REVIEW_REQUIRED: 'Content changed after review. Edit and save this draft, then review it again.',
      PUBLISHED_PAPER_IMMUTABLE: 'Published papers keep their original content. Archive this paper and create a new draft.',
      PAPER_CHANGED_RELOAD: 'This paper changed in another session. Reload and inspect the latest version.',
      QUESTION_CHANGED_RELOAD: 'This question changed in another session. Reload before reviewing it.',
      INVALID_REVIEW_TRANSITION: 'Complete the previous review step first.',
      PAPER_ARCHIVED: 'This paper is archived. Create a new draft to use its category again.',
    };
    return (error.code && authoringErrors[error.code]) || error.code || error.message;
  }
  return 'Network or server error. Please check your connection and try again.';
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (options.auth !== false && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${Config.apiBaseUrl}${path}`, { ...options, headers });
  const envelope = (await response.json().catch(() => ({ success: false, error: 'INVALID_RESPONSE' }))) as ApiEnvelope<T>;

  if (response.status === 401 && options.auth !== false && options.retryOnUnauthorized !== false) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, retryOnUnauthorized: false });
    }
  }

  if (!response.ok || envelope.success === false) {
    throw new ApiError(response.status, envelope);
  }
  return envelope.data as T;
}

async function refreshSession() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;
    try {
      const data = await apiRequest<AuthResponseDto>('/auth/refresh', {
        auth: false,
        retryOnUnauthorized: false,
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      setAccessToken(data.accessToken);
      await saveRefreshToken(data.refreshToken);
      return data;
    } catch {
      setAccessToken(null);
      await clearRefreshToken();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}
