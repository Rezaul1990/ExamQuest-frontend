import type { AuthUser } from '@/models/domain/Auth';
import { academicGroups } from '@/constants/Academic';
import { staffPermissions } from '@/constants/Permissions';

export const profileRoleLabel = { ADMIN: 'Administrator', STAFF: 'Staff', MEMBER: 'Student' } as const;
export const profileStatusLabel = { active: 'Active', suspended: 'Suspended', invited: 'Invitation pending', pending_verification: 'Verification pending' } as const;
export function profileInitials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => Array.from(part)[0]).join('').toLocaleUpperCase() || 'EQ';
}
export function profileDate(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Not provided';
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}
export function profileSections(user: AuthUser) {
  const sections = [{ title: 'Personal details', rows: [
    { label: 'Full name', value: user.name }, { label: 'Email address', value: user.email },
    { label: 'Phone number', value: user.phone || 'Not provided' },
    { label: 'Joined ExamQuest', value: profileDate(user.createdAt) },
  ] }];
  if (user.role === 'MEMBER') {
    sections.push({ title: 'Academic details', rows: [
      { label: 'Education level', value: user.educationLevel || 'Not provided' },
      { label: 'Class', value: user.className || 'Not provided' },
      { label: 'Group', value: academicGroups.find((group) => group.value === user.group)?.label || 'Not provided' },
      { label: 'Academic year', value: user.academicYear ? String(user.academicYear) : 'Not provided' },
      { label: 'Date of birth', value: profileDate(user.dateOfBirth) },
    ] });
    sections.push({ title: 'Guardian contact', rows: [
      { label: 'Guardian name', value: user.parent?.name || 'Not provided' },
      { label: 'Relationship', value: user.parent?.relation || 'Not provided' },
      { label: 'Phone number', value: user.parent?.phone || 'Not provided' },
      ...(user.parent?.email ? [{ label: 'Email address', value: user.parent.email }] : []),
    ] });
  }
  return sections;
}
export function profilePermissions(user: AuthUser) {
  if (user.role !== 'STAFF') return [];
  return staffPermissions.filter((permission) => user.permissions?.includes(permission.key));
}
export function passwordChangeError(current: string, next: string, confirm: string) {
  if (!current) return 'Enter your current password.';
  if (current.length > 128) return 'Current password must be no longer than 128 characters.';
  if (next.length < 10 || next.length > 128) return 'New password must be 10–128 characters.';
  if (next === current) return 'Choose a different password from your current password.';
  if (next !== confirm) return 'New passwords do not match.';
  return null;
}
