export type AcademicGroup = 'Science' | 'Humanities' | 'BusinessStudies';

export const academicGroups: { value: AcademicGroup; label: string }[] = [
  { value: 'Science', label: 'Science' },
  { value: 'Humanities', label: 'Humanities (Arts)' },
  { value: 'BusinessStudies', label: 'Business Studies (Commerce)' },
];

export function currentAcademicYear() {
  return String(new Date().getFullYear());
}
