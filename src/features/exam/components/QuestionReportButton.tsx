import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { AuthButton, AuthTextField } from '@/features/auth/components/AuthFields';
import { authStyles } from '@/features/auth/Auth.styles';
import type { QuestionReportCategory } from '@/models/api/LearningApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { learningService } from '@/services/learningService';
import { learningStyles as s } from './learning.styles';

export function QuestionReportButton({ attemptId, questionId }: { attemptId: string; questionId: string }) {
  const [open,setOpen]=useState(false),[category,setCategory]=useState<QuestionReportCategory>('unclear'),[detail,setDetail]=useState('');
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  async function send() {
    if(busy||detail.trim().length<5)return;
    setBusy(true);setError('');
    try { const report=await learningService.report(attemptId,questionId,category,detail.trim());setOpen(false);setDetail('');setNotice(`Report ${report.status}. Thank you; Admin can review this question.`); }
    catch(cause){setError(getApiErrorMessage(cause));}finally{setBusy(false);}
  }
  return <>
    <AuthButton label="Report a question issue" onPress={()=>{setOpen(true);setError('');}} variant="secondary" />
    {!!notice&&<ThemedText accessibilityLiveRegion="polite" type="caption">{notice}</ThemedText>}
    <Modal visible={open} transparent animationType="fade" onRequestClose={()=>{if(!busy)setOpen(false);}}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={s.scrim}>
        <View style={s.dialog} accessibilityViewIsModal><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.stack}>
          <ThemedText type="sectionTitle">Report question issue</ThemedText>
          <ThemedText type="caption">Your report does not change the answer or your score. One report per question in this attempt is retained.</ThemedText>
          {([['unclear','Unclear wording'],['wrong_answer','Possible wrong answer'],['typo','Typing error'],['other','Other issue']] as [QuestionReportCategory,string][]).map(([value,label])=><AuthButton key={value} label={`${category===value?'✓ ':''}${label}`} disabled={busy} onPress={()=>setCategory(value)} variant="secondary" />)}
          <AuthTextField label="Describe the issue" value={detail} onChangeText={setDetail} multiline maxLength={1000} editable={!busy} placeholder="At least 5 characters" />
          {!!error&&<ThemedText accessibilityRole="alert" style={authStyles.error}>{error}</ThemedText>}
          <AuthButton label={busy?'Sending...':'Send report'} disabled={busy||detail.trim().length<5} onPress={send} />
          <AuthButton label="Cancel" disabled={busy} onPress={()=>setOpen(false)} variant="secondary" />
        </ScrollView></View>
      </KeyboardAvoidingView>
    </Modal>
  </>;
}
