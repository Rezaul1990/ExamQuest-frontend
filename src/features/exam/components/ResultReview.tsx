import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/features/auth/components/AuthFields';
import { authStyles } from '@/features/auth/Auth.styles';
import type { ResultReviewDto } from '@/models/api/LearningApi';
import { learningService } from '@/services/learningService';
import { getApiErrorMessage } from '@/services/apiClient';
import { QuestionReportButton } from './QuestionReportButton';
import { learningStyles as s } from './learning.styles';

export function ResultReview({attemptId}:{attemptId:string}){
  const [data,setData]=useState<ResultReviewDto|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[version,setVersion]=useState(0);
  useEffect(()=>{let active=true;learningService.review(attemptId).then((value)=>{if(active){setData(value);setError('');}}).catch((cause)=>{if(active)setError(getApiErrorMessage(cause));}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[attemptId,version]);
  async function bookmark(id:string,enabled:boolean){if(busy)return;setBusy(true);setError('');try{await learningService.bookmark(attemptId,id,enabled);setData((current)=>current&&({...current,questions:current.questions.map((q)=>q.id===id?{...q,bookmarked:enabled}:q)}));}catch(cause){setError(getApiErrorMessage(cause));}finally{setBusy(false);}}
  return <View style={s.stack}>
    <ThemedText type="smallBold">Answer review</ThemedText>
    {loading&&<ActivityIndicator accessibilityLabel="Loading result review" />}
    {!!error&&<ThemedText accessibilityRole="alert" style={authStyles.error}>{error}</ThemedText>}
    <AuthButton label="Refresh answer review" disabled={loading||busy} onPress={()=>{setLoading(true);setVersion((v)=>v+1);}} variant="secondary" />
    {data&&<ThemedText>{data.message}{!data.available&&data.releaseAt?` Review opens after ${new Date(data.releaseAt).toLocaleString()}.`:''}</ThemedText>}
    {data?.questions.map((q,i)=>{
      const option=(key:string|undefined)=>{const value=q.options.find((o)=>o.key===key);return value?`${value.label||value.key}. ${value.text}`:'Not answered';};
      return <View key={q.id} style={s.card}>
        <ThemedText type="smallBold">{i+1}. {q.text}</ThemedText>
        {q.options.map((o)=><ThemedText key={o.key}>{o.label||o.key}. {o.text}</ThemedText>)}
        <ThemedText>Your answer: {option(q.selectedOption)}</ThemedText><ThemedText>Correct answer: {option(q.correctOption)}</ThemedText>
        <ThemedText>{q.isCorrect?'Correct':'Incorrect / unanswered'} · {q.marksAwarded} marks</ThemedText>
        <ThemedText>{q.explanation||'No explanation was included in this paper.'}</ThemedText>
        <AuthButton label={q.bookmarked?'Remove bookmark':'Bookmark for practice'} disabled={busy} onPress={()=>bookmark(q.id,!q.bookmarked)} variant="secondary" />
        <QuestionReportButton attemptId={attemptId} questionId={q.id} />
      </View>;
    })}
  </View>;
}
