export const staffPermissions = [
  { key: 'CONTENT_READ', label: 'View academic content', description: 'Can open books, subjects and learning materials.' },
  { key: 'CONTENT_MANAGE', label: 'Manage books and materials', description: 'Can create and update study content.' },
  { key: 'QUESTION_MANAGE', label: 'Create and edit questions', description: 'Can maintain question banks for exams.' },
  { key: 'EXAM_MANAGE', label: 'Create and edit exams', description: 'Can prepare exam papers and exam settings.' },
  { key: 'RESULTS_VIEW_ALL', label: 'View student results', description: 'Can review results across members.' },
] as const;

export type StaffPermission = (typeof staffPermissions)[number]['key'];
