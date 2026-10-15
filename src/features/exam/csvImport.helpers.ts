import type { ImportPreviewRowDto, ImportRowDto } from '@/models/api/ExamApi';

export const importHeaders = ['book', 'chapter', 'question', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOption', 'explanation', 'difficulty', 'subject', 'className', 'group'] as const;
const csvCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
export function serializeImportRows(rows: ImportRowDto[]) {
  return [importHeaders.join(','), ...rows.map((row) => importHeaders.map((header) => csvCell(row[header])).join(','))].join('\r\n');
}
export function buildImportErrorReport(rows: ImportPreviewRowDto[], fileErrors: string[] = []) {
  // Leading whitespace/control characters must not hide a spreadsheet formula.
  const safeCell = (value: unknown) => {
    const text = String(value ?? '');
    return csvCell(/^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text) ? `'${text}` : text);
  };
  const lines = [['rowNumber', 'status', 'errors', ...importHeaders].map(safeCell).join(',')];
  fileErrors.forEach((error) => lines.push(['file', 'invalid', error, ...importHeaders.map(() => '')].map(safeCell).join(',')));
  rows.filter((row) => row.errors.length).forEach((row) => lines.push([row.rowNumber, row.duplicate ? 'duplicate' : 'invalid', row.errors.join(' | '), ...importHeaders.map((header) => row.data[header])].map(safeCell).join(',')));
  return '\uFEFF' + lines.join('\r\n');
}
