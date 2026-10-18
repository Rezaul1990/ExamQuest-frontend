import type { DiscoveryPaperDto, PracticeQuestionDto } from '@/models/api/LearningApi';
export function filterDiscovery(papers: DiscoveryPaperDto[], search: string, view: 'all'|'upcoming'|'reminders') {
  const query=search.trim().toLocaleLowerCase();
  return papers.filter((p)=>(view!=='upcoming'||p.upcoming)&&(view!=='reminders'||p.reminded)&&`${p.title} ${p.subject||''}`.toLocaleLowerCase().includes(query));
}
export function filterPractice(questions: PracticeQuestionDto[], view:'mistakes'|'bookmarks') {
  return questions.filter((q)=>view==='bookmarks'?q.bookmarked:!q.isCorrect);
}
export function displayOption(question: {options:{key:string;label?:string;text:string}[]}, key?:string) {
  const option=question.options.find((o)=>o.key===key);
  return option?`${option.label||option.key}. ${option.text}`:'Not answered';
}
