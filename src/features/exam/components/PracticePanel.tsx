import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { AuthButton } from '@/features/auth/components/AuthFields';
import type { OptionKey } from '@/models/api/ExamApi';
import type { PracticeQuestionDto } from '@/models/api/LearningApi';
import { displayOption, filterPractice } from '../learning.helpers';
import { useLearningStyles } from './learning.styles';

export function PracticePanel({questions}:{questions:PracticeQuestionDto[]}){
  const s = useLearningStyles();
  const [view,setView]=useState<'mistakes'|'bookmarks'>('mistakes'),[index,setIndex]=useState(0),[choice,setChoice]=useState<OptionKey|null>(null),[checked,setChecked]=useState(false);
  const pool=filterPractice(questions,view),question=pool[index];
  function reset(next:number){setIndex(next);setChoice(null);setChecked(false);}
  return <View style={s.card}>
    <ThemedText type="sectionTitle">Practice & mistake notebook</ThemedText>
    <ThemedText type="caption">Practice uses your released exam questions. It does not submit an exam, change results or use your daily allowance.</ThemedText>
    <View style={s.row}><AuthButton label={`${view==='mistakes'?'✓ ':''}Mistakes`} onPress={()=>{setView('mistakes');reset(0);}} variant="secondary" /><AuthButton label={`${view==='bookmarks'?'✓ ':''}Bookmarks`} onPress={()=>{setView('bookmarks');reset(0);}} variant="secondary" /></View>
    {!question?<ThemedText>No {view} available. Finish an exam and wait for answer release; bookmark questions from result review.</ThemedText>:<>
      <ThemedText type="smallBold">Practice {index+1}/{pool.length}</ThemedText><ThemedText type="question">{question.text}</ThemedText>
      {question.options.map((o)=><Pressable key={o.key} accessibilityRole="radio" accessibilityState={{checked:choice===o.key,disabled:checked}} disabled={checked} onPress={()=>setChoice(o.key)} style={[s.chip,s.answerOption,choice===o.key&&s.selected]}><ThemedText type="option">{o.label||o.key}. {o.text}</ThemedText></Pressable>)}
      {!checked?<AuthButton label="Check practice answer" disabled={!choice} onPress={()=>setChecked(true)} />:<View style={s.stack}>
        <ThemedText accessibilityLiveRegion="polite">{choice===question.correctOption?'Correct.':'Keep practising.'} Correct answer: {displayOption(question,question.correctOption)}</ThemedText>
        <ThemedText type="explanation">{question.explanation||'No explanation included in this paper.'}</ThemedText>
      </View>}
      <View style={s.row}><AuthButton label="Previous practice question" disabled={index===0} onPress={()=>reset(index-1)} variant="secondary" /><AuthButton label="Next practice question" disabled={index>=pool.length-1} onPress={()=>reset(index+1)} variant="secondary" /></View>
    </>}
  </View>;
}
