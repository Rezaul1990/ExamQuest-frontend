import { useRef, useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '@/store';
import { academicGroups, educationLevels, normalizeAcademicYearInput, normalizeRegistrationClass } from '@/constants/Academic';
import { FeedbackNotice } from '@/components/FeedbackNotice';
import { ThemedText } from '@/components/themed-text';
import { authService } from '@/services/authService';
import { ApiError } from '@/services/apiClient';
import type { AcademicProfileRequest } from '@/models/api/AuthApi';
import type { AuthUser } from '@/models/domain/Auth';
import { useAuthStyles } from '../Auth.styles';
import { academicProfileError, type AcademicProfileForm } from '../register.helpers';
import { authErrorMessage } from '../authFeedback';
import { AcademicChoices } from './AcademicChoices';
import { AuthButton, AuthTextField } from './AuthFields';

function draftFor(user: AuthUser): AcademicProfileForm {
  return { educationLevel: user.educationLevel || 'SSC', className: user.className || '', group: user.group || '', academicYear: user.academicYear ? String(user.academicYear) : '' };
}
export function AcademicProfileEditor({ user, disabled = false }: { user: AuthUser; disabled?: boolean }) {
  const styles = useAuthStyles();
  const [draft, setDraft] = useState(() => draftFor(user));
  const [base, setBase] = useState(user);
  const [mode, setMode] = useState<'closed' | 'edit' | 'confirm'>('closed');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const lock = useRef(false);
  const blocked = busy || disabled;
  if (user.role !== 'MEMBER') return null;
  function open() { setBase(user); setDraft(draftFor(user)); setError(''); setMessage(''); setMode('edit'); }
  function edit(next: Partial<AcademicProfileForm>) { if (!lock.current) { setDraft((value) => ({ ...value, ...next })); setError(''); } }
  function confirm() {
    const invalid = academicProfileError(draft); if (invalid) { setError(invalid); return; }
    setError(''); setMode('confirm');
  }
  async function save() {
    if (lock.current || mode !== 'confirm' || disabled) return;
    lock.current = true; setBusy(true); setError('');
    const payload: AcademicProfileRequest = { educationLevel: draft.educationLevel, className: normalizeRegistrationClass(draft.className), group: draft.group as AcademicProfileRequest['group'], academicYear: Number(normalizeAcademicYearInput(draft.academicYear)), expectedRevision: base.academicProfileRevision || 0, confirmed: true };
    try {
      const result = await authService.updateAcademicProfile(payload);
      const current = useAuth.getState().user;
      if (current?.id !== user.id) return;
      if ((current.academicProfileRevision || 0) <= (result.user.academicProfileRevision || 0)) useAuth.getState().setUser(result.user);
      setMode('closed'); setMessage('শিক্ষার তথ্য সংরক্ষিত হয়েছে। নতুন পরীক্ষার যোগ্যতা হালনাগাদ হবে; পুরোনো ফলাফল অপরিবর্তিত আছে।');
    } catch (cause) {
      if (useAuth.getState().user?.id !== user.id) return;
      setError(cause instanceof ApiError && cause.code === 'ACADEMIC_PROFILE_CHANGED' ? 'অন্য সেশনে তথ্য বদলেছে। বাতিল করে Profile refresh করুন, তারপর আবার পরিবর্তন করুন।' : authErrorMessage(cause));
    } finally { lock.current = false; setBusy(false); }
  }
  return <View style={styles.panel}>
    <ThemedText type="sectionTitle">শিক্ষার তথ্য পরিবর্তন</ThemedText>
    <ThemedText>পরিবর্তন নতুন পরীক্ষার যোগ্যতায় প্রযোজ্য হবে। পুরোনো ফলাফল, উত্তর ও চলমান পরীক্ষার সময় বদলাবে না।</ThemedText>
    {mode === 'closed' ? <AuthButton label="শিক্ষার তথ্য সম্পাদনা" disabled={blocked} onPress={open} variant="secondary" /> : <>
      {mode === 'edit' ? <>
        <AcademicChoices label="শিক্ষার স্তর" options={educationLevels.map((value) => ({ value, label: value }))} selected={draft.educationLevel} disabled={blocked} onSelect={(value) => edit({ educationLevel: value as AcademicProfileForm['educationLevel'], className: value })} />
        <AuthTextField label="শ্রেণি / বর্ষ" placeholder="SSC / HSC বা ক্যাটালগের শ্রেণি" value={draft.className} editable={!blocked} onChangeText={(className) => edit({ className })} />
        <AcademicChoices label="বিভাগ" options={academicGroups} selected={draft.group} disabled={blocked} onSelect={(group) => edit({ group: group as AcademicProfileForm['group'] })} />
        <AuthTextField label="শিক্ষাবর্ষ" placeholder="যেমন: ২০২৬" value={draft.academicYear} editable={!blocked} onChangeText={(academicYear) => edit({ academicYear: normalizeAcademicYearInput(academicYear) })} keyboardType="numeric" />
        <AuthButton label="পরিবর্তন পর্যালোচনা" disabled={blocked} onPress={confirm} />
      </> : <>
        <ThemedText type="smallBold">এই পরিবর্তন নিশ্চিত করবেন?</ThemedText>
        <ThemedText>{base.educationLevel || '—'} · {base.className || '—'} · {base.group || '—'} · {base.academicYear || '—'} → {draft.educationLevel} · {draft.className} · {draft.group} · {draft.academicYear}</ThemedText>
        <AuthButton label="নিশ্চিত করে সংরক্ষণ" disabled={blocked} busy={busy} onPress={save} />
        <AuthButton label="আবার সম্পাদনা" disabled={blocked} onPress={() => setMode('edit')} variant="secondary" />
      </>}
      <AuthButton label="বাতিল" disabled={blocked} onPress={() => { if (!lock.current) { setMode('closed'); setError(''); } }} variant="secondary" />
    </>}
    {busy && <FeedbackNotice kind="loading" title="শিক্ষার তথ্য সংরক্ষণ হচ্ছে…" />}
    {!!error && <FeedbackNotice kind="error" title="পরিবর্তন সংরক্ষিত হয়নি" message={error} />}
    {!!message && <FeedbackNotice kind="success" title="শিক্ষার তথ্য হালনাগাদ হয়েছে" message={message} onDismiss={() => setMessage('')} />}
  </View>;
}
