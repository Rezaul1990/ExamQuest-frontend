import type { AuthUser } from '@/models/domain/Auth';

export const managementSections = {
  books: { title: 'Books', permission: 'CONTENT_READ' },
  chapters: { title: 'Chapters', permission: 'CONTENT_MANAGE' },
  import: { title: 'CSV Import', permission: 'QUESTION_MANAGE' },
  question: { title: 'Questions', permission: 'QUESTION_MANAGE' },
} as const;
export type ManagementSection = keyof typeof managementSections;
export type WorkspaceSection = ManagementSection | 'dashboard' | 'paper' | 'staff';
export const tabConfig = {
  index: { title: 'Dashboard', label: 'Home', icon: { ios: 'house', android: 'home', web: 'home' } },
  exams: { title: 'Exams', label: 'Exams', icon: { ios: 'pencil.and.list.clipboard', android: 'assignment', web: 'assignment' } },
  results: { title: 'Results', label: 'Results', icon: { ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' } },
  papers: { title: 'Question Papers', label: 'Papers', icon: { ios: 'doc.text', android: 'description', web: 'description' } },
  staff: { title: 'Staff', label: 'Staff', icon: { ios: 'person.2', android: 'group', web: 'group' } },
  management: { title: 'Management', label: 'Manage', icon: { ios: 'folder', android: 'folder', web: 'folder' } },
  profile: { title: 'Profile', label: 'Profile', icon: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' } },
} as const;
export type TabName = keyof typeof tabConfig;

export function canManageSection(user: AuthUser | null, section: string): section is ManagementSection {
  if (!Object.hasOwn(managementSections, section)) return false;
  return user?.role === 'ADMIN' || (user?.role === 'STAFF' && !!user.permissions?.includes(managementSections[section as ManagementSection].permission));
}
export function canOpenTab(user: AuthUser | null, tab: TabName) {
  if (!user) return false;
  if (tab === 'index' || tab === 'profile') return true;
  if (tab === 'exams' || tab === 'results') return user.role === 'MEMBER';
  if (tab === 'staff') return user.role === 'ADMIN';
  if (tab === 'papers') return user.role === 'ADMIN' || (user.role === 'STAFF' && !!user.permissions?.includes('EXAM_MANAGE'));
  return Object.keys(managementSections).some((section) => canManageSection(user, section));
}
export function workspaceHref(section: WorkspaceSection) {
  if (section === 'dashboard') return '/' as const;
  if (section === 'paper') return '/papers' as const;
  if (section === 'staff') return '/staff' as const;
  return `/management/${section}` as const;
}
