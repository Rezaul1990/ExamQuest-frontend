import { apiRequest } from './apiClient';
import type { DiscoveryDto, LearningOverviewDto, QuestionReportCategory, QuestionReportDto, ResultReviewDto } from '@/models/api/LearningApi';

const root = '/exams/learning';
export const learningService = {
  overview: () => apiRequest<LearningOverviewDto>(root),
  discovery: () => apiRequest<DiscoveryDto>(root + '/discovery'),
  review: (id: string) => apiRequest<ResultReviewDto>(`${root}/attempts/${id}/review`),
  bookmark: (id: string, questionId: string, enabled: boolean) => apiRequest<{ enabled: boolean }>(`${root}/attempts/${id}/questions/${questionId}/bookmark`, { method: 'PUT', body: JSON.stringify({ enabled }) }),
  reminder: (id: string, enabled: boolean) => apiRequest<{ enabled: boolean }>(`${root}/papers/${id}/reminder`, { method: 'PUT', body: JSON.stringify({ enabled }) }),
  report: (id: string, questionId: string, category: QuestionReportCategory, detail: string) => apiRequest<{ id: string; status: string }>(`${root}/attempts/${id}/questions/${questionId}/report`, { method: 'PUT', body: JSON.stringify({ category, detail }) }),
  reports: (page: number, status: string) => apiRequest<{ page: number; total: number; reports: QuestionReportDto[] }>(`/exams/admin/student-reports?page=${page}&status=${encodeURIComponent(status)}`),
  resolve: (id: string, status: 'resolved' | 'dismissed', resolution: string) => apiRequest(`/exams/admin/student-reports/${id}`, { method: 'PATCH', body: JSON.stringify({ status, resolution }) }),
  release: (id: string) => apiRequest(`/exams/admin/question-papers/${id}/release-results`, { method: 'POST', body: '{}' }),
};
