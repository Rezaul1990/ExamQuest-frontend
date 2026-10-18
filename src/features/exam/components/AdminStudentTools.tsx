import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { AuthButton, AuthTextField } from '@/features/auth/components/AuthFields';
import { authStyles } from '@/features/auth/Auth.styles';
import type { QuestionReportDto } from '@/models/api/LearningApi';
import type { QuestionPaperDto } from '@/models/api/ExamApi';
import { learningService } from '@/services/learningService';
import { getApiErrorMessage } from '@/services/apiClient';
import { learningStyles as s } from './learning.styles';

export function AdminQuestionReports(){
  const [expanded,setExpanded]=useState(false),[page,setPage]=useState(1),[status,setStatus]=useState('open'),[version,setVersion]=useState(0);
  const [data,setData]=useState<{reports:QuestionReportDto[];total:number}|null>(null),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [selected,setSelected]=useState<QuestionReportDto|null>(null),[resolution,setResolution]=useState('');
  useEffect(()=>{
    if(!expanded)return;
    let active=true;
    learningService.reports(page,status).then((value)=>{if(active){setData(value);setError('');}}).catch((cause)=>{if(active)setError(getApiErrorMessage(cause));}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[expanded,page,status,version]);
  function reload(){setLoading(true);setVersion((v)=>v+1);}
  async function resolve(next:'resolved'|'dismissed'){
    if(!selected||busy||resolution.trim().length<5)return;setBusy(true);setError('');
    try{await learningService.resolve(selected.id,next,resolution.trim());setSelected(null);reload();}
    catch(cause){setError(getApiErrorMessage(cause));}finally{setBusy(false);}
  }
  return <View style={s.card}>
    <AuthButton label={expanded?'Hide student question reports':'Review student question reports'} onPress={()=>{setExpanded(!expanded);if(!expanded)setLoading(true);}} variant="secondary" />
    {expanded&&<>
      <ThemedText type="caption">Reports refer to frozen exam questions. Resolve or dismiss with a reason; edit the bank separately for future papers. Accepted scores stay unchanged.</ThemedText>
      <View style={s.row}>{['open','resolved','dismissed','all'].map((value)=><AuthButton key={value} label={`${status===value?'✓ ':''}${value}`} disabled={loading} onPress={()=>{setStatus(value);setPage(1);setLoading(true);setVersion((v)=>v+1);}} variant="secondary" />)}</View>
      <AuthButton label="Reload reports" disabled={loading} onPress={reload} variant="secondary" />
      {loading&&<ActivityIndicator accessibilityLabel="Loading reports" />}
      {!!error&&<ThemedText accessibilityRole="alert" style={authStyles.error}>{error}</ThemedText>}
      {!loading&&!data?.reports.length&&<ThemedText>No reports in this category.</ThemedText>}
      {data?.reports.map((r)=><View key={r.id} style={s.card}>
        <ThemedText type="smallBold">{r.paperTitle} · {r.status}</ThemedText><ThemedText>{r.questionText}</ThemedText>
        <ThemedText>{r.category}: {r.detail}</ThemedText>{!!r.resolution&&<ThemedText>Resolution: {r.resolution}</ThemedText>}
        {r.status==='open'&&<AuthButton label="Triage report" disabled={loading} onPress={()=>{setSelected(r);setResolution('');setError('');}} variant="secondary" />}
      </View>)}
      <ThemedText>Page {page} · {data?.total||0} reports</ThemedText>
      <View style={s.row}><AuthButton label="Previous report page" disabled={loading||page===1} onPress={()=>{setPage(page-1);setLoading(true);}} variant="secondary" /><AuthButton label="Next report page" disabled={loading||page*20>=(data?.total||0)} onPress={()=>{setPage(page+1);setLoading(true);}} variant="secondary" /></View>
    </>}
    <Modal visible={!!selected} transparent onRequestClose={()=>{if(!busy)setSelected(null);}}>
      <View style={s.scrim}><View style={s.dialog} accessibilityViewIsModal><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.stack}>
        <ThemedText type="sectionTitle">Triage question report</ThemedText><ThemedText>{selected?.detail}</ThemedText>
        <AuthTextField label="Resolution / reason" value={resolution} onChangeText={setResolution} multiline maxLength={1000} editable={!busy} placeholder="At least 5 characters" />
        {!!error&&<ThemedText accessibilityRole="alert" style={authStyles.error}>{error}</ThemedText>}
        <AuthButton label="Resolve report" disabled={busy||resolution.trim().length<5} onPress={()=>resolve('resolved')} />
        <AuthButton label="Dismiss with reason" disabled={busy||resolution.trim().length<5} onPress={()=>resolve('dismissed')} variant="secondary" />
        <AuthButton label="Cancel" disabled={busy} onPress={()=>setSelected(null)} variant="secondary" />
      </ScrollView></View></View>
    </Modal>
  </View>;
}

export function CloseAndReleaseResults({paper,onChanged}:{paper:QuestionPaperDto;onChanged:()=>Promise<void>}){
  const [confirm,setConfirm]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function close(){
    if(busy)return;setBusy(true);setError('');
    try{await learningService.release(paper.id);setConfirm(false);await onChanged();}catch(cause){setError(getApiErrorMessage(cause));}finally{setBusy(false);}
  }
  if(paper.availableUntil)return <ThemedText type="caption">Answer review opens after closing plus {paper.durationMinutes} minutes: {new Date(Date.parse(paper.availableUntil)+paper.durationMinutes*60000).toLocaleString()}.</ThemedText>;
  if(paper.status==='draft')return null;
  if(paper.availabilityStatus==='scheduled')return <ThemedText type="caption">This exam has not opened yet. Closing becomes available after opening; reload the workspace then.</ThemedText>;
  return <>
    <AuthButton label="Close exam & schedule answer release" disabled={busy} onPress={()=>setConfirm(true)} variant="secondary" />
    <Modal visible={confirm} transparent onRequestClose={()=>{if(!busy)setConfirm(false);}}>
      <View style={s.scrim}><View style={s.dialog} accessibilityViewIsModal>
        <ThemedText type="sectionTitle">Close {paper.title}?</ThemedText>
        <ThemedText>New attempts will stop. Existing attempts keep their timer. Correct answers and explanations open after another {paper.durationMinutes} minutes. This cannot be undone.</ThemedText>
        {!!error&&<ThemedText accessibilityRole="alert" style={authStyles.error}>{error}</ThemedText>}
        <AuthButton label={busy?'Closing...':'Close exam and schedule review'} disabled={busy} onPress={close} />
        <AuthButton label="Cancel" disabled={busy} onPress={()=>setConfirm(false)} variant="secondary" />
      </View></View>
    </Modal>
  </>;
}
