import { ApiError } from '@/services/apiClient';

export type TokenAction = 'verify-email' | 'reset-password' | 'staff-invite' | 'forgot-password';
export const normalizeAuthEmail = (email: string) => email.trim().toLowerCase();
export function emailError(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? null : 'সঠিক ইমেইল ঠিকানা লিখুন।';
}
export function loginError(email: string, password: string) {
  return emailError(email) || (!password ? 'পাসওয়ার্ড লিখুন।' : password.length > 128 ? 'পাসওয়ার্ড সর্বোচ্চ ১২৮ অক্ষরের হতে পারে।' : null);
}
export function tokenActionError(action: TokenAction, email: string, token: string, password: string) {
  if (action === 'forgot-password') return emailError(email);
  if (token.trim().length < 20 || token.trim().length > 300) return 'ইমেইলের লিংকটি খুলুন অথবা সঠিক নিরাপত্তা কোড দিন।';
  if (action !== 'verify-email' && (password.length < 10 || password.length > 128)) return 'নতুন পাসওয়ার্ড ১০ থেকে ১২৮ অক্ষরের হতে হবে।';
  return null;
}
export function authErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'INVALID_CREDENTIALS' || error.code === 'ACCOUNT_NOT_ACTIVE') return 'লগইন করা যায়নি। ইমেইল ও পাসওয়ার্ড যাচাই করুন; প্রয়োজন হলে অ্যাডমিনের সহায়তা নিন।';
    if (error.code === 'INVALID_OR_EXPIRED_TOKEN') return 'লিংকটি আর কার্যকর নেই বা সঠিক নয়। নতুন লিংকের জন্য আবার অনুরোধ করুন।';
    if (error.code === 'INVALID_OR_EXPIRED_INVITE') return 'আমন্ত্রণ লিংকটি আর কার্যকর নেই বা সঠিক নয়। অ্যাডমিনের কাছে নতুন আমন্ত্রণ চান।';
    if (error.status === 429 || error.code === 'RATE_LIMITED') return 'অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।';
    if (error.status >= 500) return 'সেবা সাময়িকভাবে পাওয়া যাচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।';
    if (error.code === 'VALIDATION_ERROR') return 'দেওয়া তথ্য যাচাই করুন। ইমেইল, নিরাপত্তা কোড ও পাসওয়ার্ডের নিয়ম মেনে আবার চেষ্টা করুন।';
    return 'কাজটি সম্পন্ন হয়নি। তথ্য যাচাই করে আবার চেষ্টা করুন।';
  }
  return 'সংযোগ করা যায়নি। ইন্টারনেট সংযোগ যাচাই করে আবার চেষ্টা করুন।';
}
export const tokenActionSuccess: Record<TokenAction, string> = {
  'forgot-password': 'এই ইমেইলের জন্য রিসেটের ব্যবস্থা থাকলে নির্দেশনা পাঠানো হবে। ইনবক্স ও স্প্যাম দেখুন; না পেলে পরে আবার চেষ্টা করুন।',
  'verify-email': 'ইমেইল যাচাই হয়েছে। এখন লগইন করুন।',
  'reset-password': 'পাসওয়ার্ড পরিবর্তন হয়েছে। নতুন পাসওয়ার্ড দিয়ে আবার লগইন করুন।',
  'staff-invite': 'স্টাফ অ্যাকাউন্ট চালু হয়েছে। এখন লগইন করুন।',
};
