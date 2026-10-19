import { useEffect, useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { FeedbackNotice } from '@/components/FeedbackNotice';
import { ThemedText } from '@/components/themed-text';
import { AuthButton, AuthTextField } from '@/features/auth/components/AuthFields';
import type { QuestionReportDto } from '@/models/api/LearningApi';
import type { QuestionPaperDto } from '@/models/api/ExamApi';
import { learningService } from '@/services/learningService';
import { getApiErrorMessage } from '@/services/apiClient';
import { useLearningStyles } from './learning.styles';

export function AdminQuestionReports(){
  const s = useLearningStyles();
  const [expanded,setExpanded]=useState(false),[page,setPage]=useState(1),[status,setStatus]=useState('open'),[version,setVersion]=useState(0);
  const [data,setData]=useState<{reports:QuestionReportDto[];total:number;page:number;filter:string}|null>(null),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false);
  const [loadError,setLoadError]=useState(''),[actionError,setActionError]=useState(''),[message,setMessage]=useState('');
  const currentData=data?.page===page&&data.filter===status?data:null;
  const [selected,setSelected]=useState<QuestionReportDto|null>(null),[resolution,setResolution]=useState('');
  useEffect(()=>{
    if(!expanded)return;
    let active=true;
    learningService.reports(page,status).then((value)=>{if(active){setData({...value,page,filter:status});setLoadError('');}}).catch((cause)=>{if(active)setLoadError(getApiErrorMessage(cause));}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[expanded,page,status,version]);
  function reload(){setLoadError('');setLoading(true);setVersion((v)=>v+1);}
  async function resolve(next:'resolved'|'dismissed'){
    if(!selected||busy||resolution.trim().length<5)return;setBusy(true);setActionError('');setMessage('');
    try{await learningService.resolve(selected.id,next,resolution.trim());setSelected(null);setMessage(next==='resolved'?'Report resolved.':'Report dismissed.');reload();}
    catch(cause){setActionError(getApiErrorMessage(cause));}finally{setBusy(false);}
  }
  return <View style={s.card}>
    <AuthButton label={expanded?'Hide student question reports':'Review student question reports'} onPress={()=>{setExpanded(!expanded);if(!expanded){setLoadError('');setLoading(true);}}} variant="secondary" />
    {expanded&&<>
      <ThemedText type="caption">Reports refer to frozen exam questions. Resolve or dismiss with a reason; edit the bank separately for future papers. Accepted scores stay unchanged.</ThemedText>
      <View style={s.row}>{['open','resolved','dismissed','all'].map((value)=><AuthButton key={value} label={`${status===value?'✓ ':''}${value}`} disabled={loading||busy} onPress={()=>{setStatus(value);setPage(1);setLoadError('');setLoading(true);setVersion((v)=>v+1);}} variant="secondary" />)}</View>
      <AuthButton label="Reload reports" disabled={loading||busy} onPress={reload} variant="secondary" />
      {loading&&<FeedbackNotice kind="loading" title="Loading reports" />}
      {!!loadError&&<FeedbackNotice kind="error" title="Reports could not load" message={loadError} onRetry={reload} retryLabel="Retry loading reports" busy={loading||busy} />}
      {!!message&&<FeedbackNotice kind="success" title="Report updated" message={message} onDismiss={()=>setMessage('')} />}
      {!loading&&!loadError&&currentData&&!currentData.reports.length&&<FeedbackNotice kind="empty" title="No reports in this category" />}
      {currentData?.reports.map((r)=><View key={r.id} style={s.card}>
        <ThemedText type="smallBold">{r.paperTitle} · {r.status}</ThemedText><ThemedText>{r.questionText}</ThemedText>
        <ThemedText>{r.category}: {r.detail}</ThemedText>{!!r.resolution&&<ThemedText>Resolution: {r.resolution}</ThemedText>}
        {r.status==='open'&&<AuthButton label="Triage report" disabled={loading||busy} onPress={()=>{setSelected(r);setResolution('');setActionError('');}} variant="secondary" />}
      </View>)}
      {currentData&&<ThemedText>Page {page} · {currentData.total} reports</ThemedText>}
      <View style={s.row}><AuthButton label="Previous report page" disabled={loading||busy||page===1} onPress={()=>{setPage(page-1);setLoadError('');setLoading(true);}} variant="secondary" /><AuthButton label="Next report page" disabled={loading||busy||!currentData||page*20>=currentData.total} onPress={()=>{setPage(page+1);setLoadError('');setLoading(true);}} variant="secondary" /></View>
    </>}
    <Modal visible={!!selected} transparent onRequestClose={()=>{if(!busy)setSelected(null);}}>
      <View style={s.scrim}><View style={s.dialog} accessibilityViewIsModal><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.stack}>
        <ThemedText type="sectionTitle">Triage question report</ThemedText><ThemedText>{selected?.detail}</ThemedText>
        <AuthTextField label="Resolution / reason" value={resolution} onChangeText={setResolution} multiline maxLength={1000} editable={!busy} placeholder="At least 5 characters" />
        {!!actionError&&<FeedbackNotice kind="error" title="Report update failed" message={actionError} />}
        <AuthButton label="Resolve report" disabled={busy||resolution.trim().length<5} onPress={()=>resolve('resolved')} />
        <AuthButton label="Dismiss with reason" disabled={busy||resolution.trim().length<5} onPress={()=>resolve('dismissed')} variant="secondary" />
        <AuthButton label="Cancel" disabled={busy} onPress={()=>setSelected(null)} variant="secondary" />
      </ScrollView></View></View>
    </Modal>
  </View>;
}

export function CloseAndReleaseResults({paper,onChanged}:{paper:QuestionPaperDto;onChanged:()=>Promise<void>}){
  const s = useLearningStyles();
  const [confirm,setConfirm]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState(''),[refreshError,setRefreshError]=useState(''),[closed,setClosed]=useState(false),[refreshing,setRefreshing]=useState(false);
  async function reloadPaper(){setRefreshError('');setRefreshing(true);try{await onChanged();}catch(cause){setRefreshError(getApiErrorMessage(cause));}finally{setRefreshing(false);}}
  async function close(){
    if(busy)return;setBusy(true);setError('');
    try{await learningService.release(paper.id);setClosed(true);setConfirm(false);setMessage('Exam closed. Answer review is scheduled after the final attempt time.');await reloadPaper();}catch(cause){setError(getApiErrorMessage(cause));}finally{setBusy(false);}
  }
  const feedback=<>{!!message&&<FeedbackNotice kind="success" title="Exam close confirmed" message={message} onDismiss={()=>setMessage('')} />}{closed&&refreshing&&<FeedbackNotice kind="loading" title="Refreshing closed exam" />}{!!refreshError&&<FeedbackNotice kind="error" title="Paper refresh failed after closing" message={refreshError} onRetry={reloadPaper} retryLabel="Retry paper refresh" busy={busy||refreshing} />}</>;
  if(paper.availableUntil)return <>{feedback}<ThemedText type="caption">Answer review opens after closing plus {paper.durationMinutes} minutes: {new Date(Date.parse(paper.availableUntil)+paper.durationMinutes*60000).toLocaleString()}.</ThemedText></>;
  if(paper.status==='draft')return null;
  if(paper.availabilityStatus==='scheduled')return <ThemedText type="caption">This exam has not opened yet. Closing becomes available after opening; reload the workspace then.</ThemedText>;
  return <>
    {feedback}
    <AuthButton label="Close exam & schedule answer release" disabled={busy||closed||refreshing} onPress={()=>{setError('');setConfirm(true);}} variant="secondary" />
    <Modal visible={confirm} transparent onRequestClose={()=>{if(!busy)setConfirm(false);}}>
      <View style={s.scrim}><View style={s.dialog} accessibilityViewIsModal>
        <ThemedText type="sectionTitle">Close {paper.title}?</ThemedText>
        <ThemedText>New attempts will stop. Existing attempts keep their timer. Correct answers and explanations open after another {paper.durationMinutes} minutes. This cannot be undone.</ThemedText>
        {!!error&&<FeedbackNotice kind="error" title="Exam could not close" message={error} />}
        <AuthButton label={busy?'Closing...':'Close exam and schedule review'} disabled={busy} onPress={close} />
        <AuthButton label="Cancel" disabled={busy} onPress={()=>setConfirm(false)} variant="secondary" />
      </View></View>
    </Modal>
  </>;
}
