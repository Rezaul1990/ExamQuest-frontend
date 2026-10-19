import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { FeedbackNotice } from '@/components/FeedbackNotice';
import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/features/auth/components/AuthFields';
import type { ResultReviewDto } from '@/models/api/LearningApi';
import { learningService } from '@/services/learningService';
import { getApiErrorMessage } from '@/services/apiClient';
import { QuestionReportButton } from './QuestionReportButton';
import { useLearningStyles } from './learning.styles';

export function ResultReview({attemptId}:{attemptId:string}){
  const s = useLearningStyles();
  const [data,setData]=useState<ResultReviewDto|null>(null),[loadError,setLoadError]=useState(''),[actionError,setActionError]=useState(''),[message,setMessage]=useState('');
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[version,setVersion]=useState(0),[failed,setFailed]=useState<{id:string;enabled:boolean}|null>(null);
  useEffect(()=>{let active=true;learningService.review(attemptId).then((value)=>{if(active){setData(value);setLoadError('');}}).catch((cause)=>{if(active)setLoadError(getApiErrorMessage(cause));}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[attemptId,version]);
  function reload(){setLoadError('');setLoading(true);setVersion(v=>v+1);}
  async function bookmark(id:string,enabled:boolean){if(busy)return;setBusy(true);setActionError('');setMessage('');setFailed(null);try{await learningService.bookmark(attemptId,id,enabled);setData((current)=>current&&({...current,questions:current.questions.map((q)=>q.id===id?{...q,bookmarked:enabled}:q)}));setMessage(enabled?'Question bookmarked for practice.':'Bookmark removed.');}catch(cause){setFailed({id,enabled});setActionError(getApiErrorMessage(cause));}finally{setBusy(false);}}
  return <View style={s.stack}>
    <ThemedText type="smallBold">Answer review</ThemedText>
    {loading&&<FeedbackNotice kind="loading" title={data?'Refreshing answer review':'Loading answer review'} />}
    {!!loadError&&<FeedbackNotice kind="error" title="Answer review could not load" message={loadError} onRetry={reload} retryLabel="Retry loading answer review" busy={loading||busy} />}
    {!!actionError&&<FeedbackNotice kind="error" title="Bookmark update failed" message={actionError} onRetry={failed?()=>{void bookmark(failed.id,failed.enabled);}:undefined} retryLabel="Retry bookmark update" busy={busy||loading} />}
    {!!message&&<FeedbackNotice kind="success" title="Bookmark updated" message={message} onDismiss={()=>setMessage('')} />}
    <AuthButton label="Refresh answer review" disabled={loading||busy} onPress={reload} variant="secondary" />
    {data&&<ThemedText>{data.message}{!data.available&&data.releaseAt?` Review opens after ${new Date(data.releaseAt).toLocaleString()}.`:''}</ThemedText>}
    {data?.available&&!loading&&!loadError&&!data.questions.length&&<FeedbackNotice kind="empty" title="No answer details available" message="This result has no reviewable frozen questions." />}
    {data?.questions.map((q,i)=>{
      const option=(key:string|undefined)=>{const value=q.options.find((o)=>o.key===key);return value?`${value.label||value.key}. ${value.text}`:'Not answered';};
      return <View key={q.id} style={s.card}>
        <ThemedText type="question">{i+1}. {q.text}</ThemedText>
        {q.options.map((o)=><ThemedText key={o.key} type="option">{o.label||o.key}. {o.text}</ThemedText>)}
        <ThemedText>Your answer: {option(q.selectedOption)}</ThemedText><ThemedText>Correct answer: {option(q.correctOption)}</ThemedText>
        <ThemedText>{q.isCorrect?'Correct':'Incorrect / unanswered'} · {q.marksAwarded} marks</ThemedText>
        <ThemedText type="explanation">{q.explanation||'No explanation was included in this paper.'}</ThemedText>
        <AuthButton label={q.bookmarked?'Remove bookmark':'Bookmark for practice'} disabled={busy||loading} busy={busy} onPress={()=>bookmark(q.id,!q.bookmarked)} variant="secondary" />
        <QuestionReportButton attemptId={attemptId} questionId={q.id} />
      </View>;
    })}
  </View>;
}
