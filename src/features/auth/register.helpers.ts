import { academicGroups, academicYearRange, educationLevels, normalizeAcademicYearInput, normalizeRegistrationClass } from '@/constants/Academic';
import type { RegisterMemberRequest } from '@/models/api/AuthApi';
import { authErrorMessage, emailError, normalizeAuthEmail } from './authFeedback';
import { ApiError } from '@/services/apiClient';

export type RegistrationForm = Omit<RegisterMemberRequest, 'academicYear' | 'parent' | 'group'> & {
  group: RegisterMemberRequest['group'] | '';
  academicYear: string; parentName: string; parentPhone: string; parentEmail: string;
  parentRelation: RegisterMemberRequest['parent']['relation'];
};
export const guardianRelations = ['Father', 'Mother', 'Guardian'] as const;
export type AcademicProfileForm = Pick<RegistrationForm, 'educationLevel' | 'className' | 'group' | 'academicYear'>;
export function academicProfileError(form: AcademicProfileForm) {
  if (!educationLevels.includes(form.educationLevel)) return 'SSC অথবা HSC নির্বাচন করুন।';
  const className = normalizeRegistrationClass(form.className);
  if (!className || className.length > 80) return 'শ্রেণি/বর্ষের নাম দিন (সর্বোচ্চ ৮০ অক্ষর)।';
  if (educationLevels.includes(className as RegistrationForm['educationLevel']) && className !== form.educationLevel) return 'শিক্ষার স্তর ও শ্রেণির SSC/HSC নির্বাচন মিলিয়ে দিন।';
  if (!academicGroups.some((group) => group.value === form.group)) return 'বিভাগ নির্বাচন করুন।';
  const year = normalizeAcademicYearInput(form.academicYear).trim();
  if (!/^\d{4}$/.test(year) || Number(year) < academicYearRange.min || Number(year) > academicYearRange.max) return 'শিক্ষাবর্ষ ২০০০ থেকে ২১০০-এর মধ্যে চার অঙ্কে লিখুন।';
  return null;
}
export function registrationError(form: RegistrationForm) {
  if (form.name.trim().length < 2 || form.name.trim().length > 120) return 'শিক্ষার্থীর নাম ২ থেকে ১২০ অক্ষরের হতে হবে।';
  if (emailError(form.email)) return 'শিক্ষার্থীর সঠিক ইমেইল লিখুন।';
  if (form.phone.trim().length < 5 || form.phone.trim().length > 30) return 'শিক্ষার্থীর ফোন নম্বর ৫ থেকে ৩০ অক্ষরের হতে হবে।';
  if (form.password.length < 10 || form.password.length > 128) return 'পাসওয়ার্ড ১০ থেকে ১২৮ অক্ষরের হতে হবে।';
  if (form.password !== form.confirmPassword) return 'দুটি পাসওয়ার্ড মিলছে না।';
  if (form.password.toLowerCase() === normalizeAuthEmail(form.email)) return 'পাসওয়ার্ড ও ইমেইল এক হতে পারবে না।';
  const academicError = academicProfileError(form);
  if (academicError) return academicError;
  if (form.parentName.trim().length < 2 || form.parentName.trim().length > 120) return 'অভিভাবকের নাম ২ থেকে ১২০ অক্ষরের হতে হবে।';
  if (form.parentPhone.trim().length < 5 || form.parentPhone.trim().length > 30) return 'অভিভাবকের ফোন নম্বর ৫ থেকে ৩০ অক্ষরের হতে হবে।';
  if (form.parentEmail.trim() && emailError(form.parentEmail)) return 'অভিভাবকের সঠিক ইমেইল দিন অথবা ফাঁকা রাখুন।';
  if (!guardianRelations.includes(form.parentRelation)) return 'অভিভাবকের সঙ্গে সম্পর্ক নির্বাচন করুন।';
  return null;
}
export function registrationPayload(form: RegistrationForm): RegisterMemberRequest {
  return {
    name: form.name.trim(), email: normalizeAuthEmail(form.email), phone: form.phone.trim(),
    password: form.password, confirmPassword: form.confirmPassword, educationLevel: form.educationLevel,
    className: normalizeRegistrationClass(form.className), group: form.group as RegisterMemberRequest['group'],
    academicYear: Number(normalizeAcademicYearInput(form.academicYear).trim()),
    parent: { name: form.parentName.trim(), phone: form.parentPhone.trim(), email: normalizeAuthEmail(form.parentEmail), relation: form.parentRelation },
  };
}
export function registrationApiError(error: unknown) {
  if (error instanceof ApiError && error.code === 'EMAIL_ALREADY_REGISTERED') return 'এই ইমেইল দিয়ে অ্যাকাউন্ট আছে। লগইন করুন অথবা পাসওয়ার্ড রিসেট করুন।';
  if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') return 'শিক্ষার্থী, শ্রেণি, বিভাগ, শিক্ষাবর্ষ ও অভিভাবকের তথ্য যাচাই করে আবার চেষ্টা করুন।';
  return authErrorMessage(error);
}
