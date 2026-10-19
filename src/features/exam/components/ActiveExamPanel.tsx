import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/features/auth/components/AuthFields';
import { useAuthStyles } from '@/features/auth/Auth.styles';
import type { ExamAttemptDto, OptionKey, QuestionPaperDto } from '@/models/api/ExamApi';
import { countdownLabel } from '../memberExam.helpers';
import { QuestionReportButton } from './QuestionReportButton';
import { useLearningStyles } from './learning.styles';

type Props={attempt:ExamAttemptDto;paper:QuestionPaperDto;answers:Record<string,OptionKey>;reviewIds:string[];secondsLeft:number;submitting:boolean;saving:boolean;saveMessage:string;error:string|null;
  select:(id:string,option:OptionKey)=>void;toggleReview:(id:string)=>void;submit:(reason:'manual'|'timer_expired')=>Promise<void>;save:()=>Promise<boolean>;reload:()=>Promise<void>;leave:()=>void};
export function ActiveExamPanel(p:Props){
  const authStyles = useAuthStyles();
  const s = useLearningStyles();
  const [index,setIndex]=useState(0),[confirm,setConfirm]=useState(false);
  const questions=p.attempt.questions||[],question=questions[index],unanswered=questions.filter((q)=>!p.answers[q.id]).length;
  const disabled=p.submitting||p.secondsLeft<=0;
  return <View style={s.stack}>
    <ThemedText type="sectionTitle">{p.paper.title}</ThemedText>
    <ThemedText type="small">{questions.length-unanswered}/{questions.length} answered · {p.reviewIds.length} marked for review</ThemedText>
    <ThemedText type="sectionTitle">Time left: {countdownLabel(p.secondsLeft)}</ThemedText>
    <ThemedText accessibilityLiveRegion="polite" type="caption">{p.saveMessage}</ThemedText>
    <ThemedText type="caption">Question navigator: ✓ answered · ! review · — unanswered</ThemedText>
    <View style={s.row}>{questions.map((q,i)=><Pressable key={q.id} accessibilityRole="button" accessibilityLabel={`Question ${i+1}, ${p.answers[q.id]?'answered':'unanswered'}${p.reviewIds.includes(q.id)?', marked for review':''}`} accessibilityState={{selected:index===i}} onPress={()=>setIndex(i)} style={[s.chip,index===i&&s.selected,p.reviewIds.includes(q.id)&&s.marked]}><ThemedText>{i+1} {p.reviewIds.includes(q.id)?'!':p.answers[q.id]?'✓':'—'}</ThemedText></Pressable>)}</View>
    {question&&<View style={s.card}>
      <ThemedText accessibilityRole="header" accessibilityLiveRegion="polite" type="smallBold">Question {index+1} of {questions.length}</ThemedText>
      <ThemedText type="question">{question.text}</ThemedText>
      {question.options.map((option)=><Pressable key={option.key} accessibilityRole="radio" accessibilityLabel={`${option.label||option.key}. ${option.text}`} accessibilityState={{checked:p.answers[question.id]===option.key,disabled}} disabled={disabled} onPress={()=>p.select(question.id,option.key)} style={[s.chip,s.answerOption,p.answers[question.id]===option.key&&s.selected]}><ThemedText type="option">{p.answers[question.id]===option.key?'✓ ':''}{option.label||option.key}. {option.text}</ThemedText></Pressable>)}
      <AuthButton label={p.reviewIds.includes(question.id)?'Remove review mark':'Mark for review'} disabled={disabled} onPress={()=>p.toggleReview(question.id)} variant="secondary" />
      <View style={s.row}><AuthButton label="Previous" disabled={index===0} onPress={()=>setIndex(index-1)} variant="secondary" /><AuthButton label="Next" disabled={index===questions.length-1} onPress={()=>setIndex(index+1)} variant="secondary" /></View>
      <QuestionReportButton key={question.id} attemptId={p.attempt.id} questionId={question.id} />
    </View>}
    {!!p.error&&<ThemedText accessibilityRole="alert" style={authStyles.error}>{p.error}</ThemedText>}
    {p.submitting&&<ActivityIndicator accessibilityLabel="Submitting exam" />}
    {p.secondsLeft===0&&<ThemedText style={authStyles.notice}>Time is over. Only answers saved before the server deadline are used.</ThemedText>}
    <AuthButton label={p.submitting?'Submitting...':p.secondsLeft===0?'Retry expiry submission':'Review and submit exam'} disabled={p.submitting} busy={p.submitting} onPress={()=>p.secondsLeft===0?p.submit('timer_expired'):setConfirm(true)} />
    <AuthButton label="Retry saving answers" disabled={disabled||p.saving} onPress={p.save} variant="secondary" />
    <AuthButton label="Reload saved answers" disabled={p.submitting||p.saving} onPress={p.reload} variant="secondary" />
    <AuthButton label="Save and leave exam" disabled={p.submitting||p.saving} onPress={p.leave} variant="secondary" />
    <Modal visible={confirm&&p.secondsLeft>0} transparent onRequestClose={()=>setConfirm(false)}>
      <View style={s.scrim}><View style={s.dialog} accessibilityViewIsModal>
        <ThemedText type="sectionTitle">Submit this exam?</ThemedText>
        <ThemedText>{unanswered} unanswered · {p.reviewIds.length} marked for review. You cannot change answers after submission. A successful submission uses today’s allowance.</ThemedText>
        <AuthButton label="Submit final answers" disabled={p.submitting} onPress={()=>{setConfirm(false);void p.submit('manual');}} />
        <AuthButton label="Keep reviewing" onPress={()=>setConfirm(false)} variant="secondary" />
      </View></View>
    </Modal>
  </View>;
}
