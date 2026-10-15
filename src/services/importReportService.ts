import { Share } from 'react-native';

export async function exportImportReport(csv: string) {
  await Share.share({ title: 'ExamQuest CSV import error report', message: csv });
}
