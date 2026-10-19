export type AcademicGroup = 'Science' | 'Humanities' | 'BusinessStudies';
export const educationLevels = ['SSC', 'HSC'] as const;
export type EducationLevel = typeof educationLevels[number];
export const academicYearRange = { min: 2000, max: 2100 } as const;

export function normalizeRegistrationClass(value: string) {
  const trimmed = value.trim();
  return educationLevels.includes(trimmed.toUpperCase() as EducationLevel) ? trimmed.toUpperCase() : trimmed;
}

export function normalizeAcademicYearInput(value: string) {
  return value.replace(/[০-৯]/g, (digit) => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)));
}

export const academicGroups: { value: AcademicGroup; label: string }[] = [
  { value: 'Science', label: 'Science' },
  { value: 'Humanities', label: 'Humanities (Arts)' },
  { value: 'BusinessStudies', label: 'Business Studies (Commerce)' },
];

export function currentAcademicYear() {
  return String(new Date().getFullYear());
}
