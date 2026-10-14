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
    return error.code || error.message;
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
