import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { ExamAttemptDto, ExamBookDto, ExamChapterDto, ExamQuotaDto, OptionKey, QuestionPaperDto } from '@/models/api/ExamApi';
import { ApiError, getApiErrorMessage } from '@/services/apiClient';
import { examService } from '@/services/examService';
import { answersFromAttempt, remainingSeconds } from '../memberExam.helpers';

type Session = { attempt: ExamAttemptDto; paper: QuestionPaperDto; answers: Record<string, OptionKey>; reviewQuestionIds: string[]; revision: number; edit: number; saved: number; serverAnchor: number; monotonicAnchor: number };
const payload = (answers: Record<string, OptionKey>) => Object.entries(answers).map(([questionId, selectedOption]) => ({ questionId, selectedOption }));
export function useMemberExam() {
  const [reviewQuestionIds,setReviewQuestionIds]=useState<string[]>([]);
  const [books,setBooks]=useState<ExamBookDto[]>([]), [chapters,setChapters]=useState<ExamChapterDto[]>([]), [papers,setPapers]=useState<QuestionPaperDto[]>([]), [attempts,setAttempts]=useState<ExamAttemptDto[]>([]);
  const [selectedBookId,setSelectedBookId]=useState(''), [selectedChapterId,setSelectedChapterId]=useState('');
  const [activeAttempt,setActiveAttempt]=useState<ExamAttemptDto|null>(null),[activePaper,setActivePaper]=useState<QuestionPaperDto|null>(null),[answers,setAnswers]=useState<Record<string,OptionKey>>({});
  const [result,setResult]=useState<ExamAttemptDto|null>(null),[quota,setQuota]=useState<ExamQuotaDto|null>(null);
  const [refreshVersion,setRefreshVersion]=useState(0);
  const [loading,setLoading]=useState(true),[submitting,setSubmitting]=useState(false),[saving,setSaving]=useState(false),[saveMessage,setSaveMessage]=useState(''),[secondsLeft,setSecondsLeft]=useState(0);
  const [message,setMessage]=useState<string|null>(null),[error,setError]=useState<string|null>(null);
  const session=useRef<Session|null>(null),submitLock=useRef(false),saveFlight=useRef<Promise<boolean>|null>(null),retryAt=useRef(0);

  const refresh=useCallback(async()=>{
    setLoading(true);setError(null);
    try{
      const [catalog,history,status]=await Promise.all([examService.listBooks(),examService.listAttempts(),examService.examStatus()]);
      setBooks(catalog.books);setAttempts(history.attempts);setQuota(status);setRefreshVersion((value)=>value+1);
      setSelectedBookId((id)=>catalog.books.some((book)=>book.id===id)?id:catalog.books[0]?.id||'');
      if(!catalog.books.length){setChapters([]);setPapers([]);}
    }catch(cause){setError(getApiErrorMessage(cause));}
    finally{setLoading(false);}
  },[]);
  const complete=useCallback((attempt:ExamAttemptDto)=>{
    session.current=null;setActiveAttempt(null);setActivePaper(null);setAnswers({});setSaveMessage('');
    if(attempt.status==='submitted'){setResult(attempt);setMessage(`Submitted. Score ${attempt.score}/${attempt.total}.`);}else{setMessage('Attempt closed without a successful submission. Check your daily allowance before starting again.');}
    void refresh();
  },[refresh]);
  const adopt=useCallback((attempt:ExamAttemptDto,paper?:QuestionPaperDto)=>{
    if(attempt.status!=='in_progress'){complete(attempt);return;}
    if(!paper)return;
    const restored=answersFromAttempt(attempt),serverAnchor=Date.parse(attempt.serverNow||new Date().toISOString());
    session.current={attempt,paper,answers:restored,reviewQuestionIds:attempt.reviewQuestionIds||[],revision:attempt.answerRevision||0,edit:0,saved:0,serverAnchor,monotonicAnchor:performance.now()};
    setReviewQuestionIds(attempt.reviewQuestionIds||[]);
    setActiveAttempt(attempt);setActivePaper(paper);setAnswers(restored);setSaveMessage('Saved answers loaded.');setSecondsLeft(remainingSeconds(attempt.expiresAt,serverAnchor,0));retryAt.current=0;
  },[complete]);
  const submitExam=useCallback(async(reason:'manual'|'timer_expired'='manual')=>{
    const current=session.current;if(!current||submitLock.current)return;
    submitLock.current=true;setSubmitting(true);setError(null);
    try{
      const response=await examService.submitExam(current.attempt.id,reason==='manual'?payload(current.answers):[],reason);
      if(session.current?.attempt.id===current.attempt.id)complete(response.attempt);
    }catch(cause){
      setError(getApiErrorMessage(cause));retryAt.current=performance.now()+5000;
      if(cause instanceof ApiError&&['DAILY_SUBMISSION_LIMIT','ATTEMPT_EXPIRED','EXAM_ALREADY_SUBMITTED'].includes(cause.code||'')){
        try{const status=await examService.examStatus();setQuota(status);const response=await examService.getAttempt(current.attempt.id);if(response.attempt.status!=='in_progress')complete(response.attempt);}catch{/* Keep the failed state reviewable and retryable. */}
      }
      if(cause instanceof ApiError&&cause.code==='ATTEMPT_NOT_EXPIRED'){
        try{const response=await examService.getAttempt(current.attempt.id);adopt(response.attempt,response.paper);}catch{/* Retry can resync after network recovery. */}
      }
    }finally{submitLock.current=false;setSubmitting(false);}
  },[adopt,complete]);
  const flushSave=useCallback(async():Promise<boolean>=>{
    if(saveFlight.current)return saveFlight.current;
    const work=(async()=>{
      setSaving(true);
      try{
        while(session.current&&session.current.edit>session.current.saved&&!submitLock.current){
          const current=session.current,captured=current.edit;
          if(remainingSeconds(current.attempt.expiresAt,current.serverAnchor,performance.now()-current.monotonicAnchor)===0)return false;
          const response=await examService.saveAnswers(current.attempt.id,payload(current.answers),current.revision,current.reviewQuestionIds);
          if(session.current!==current)return true;
          if(response.attempt.status!=='in_progress'){complete(response.attempt);return true;}
          current.revision=response.attempt.answerRevision||0;current.saved=captured;
          setSaveMessage(current.edit===current.saved?'Answers saved.':'Saving latest changes...');
        }
        return true;
      }catch(cause){
        setSaveMessage('Answers are not saved. Retry when connected.');setError(getApiErrorMessage(cause));
        if(cause instanceof ApiError&&cause.code==='ATTEMPT_CHANGED_RELOAD'&&session.current){
          const id=session.current.attempt.id;
          try{const response=await examService.getAttempt(id);adopt(response.attempt,response.paper);setError('Another device changed this attempt. Latest saved answers loaded; review them before submitting.');}catch{/* Never overwrite a newer server revision on conflict. */}
        }
        return false;
      }finally{setSaving(false);}
    })();saveFlight.current=work;
    try{return await work;}finally{saveFlight.current=null;}
  },[adopt,complete]);
  useFocusEffect(useCallback(()=>{void refresh();},[refresh]));
  useEffect(()=>{
    if(!selectedBookId)return;
    let current=true;
    Promise.all([examService.listChapters(selectedBookId),examService.listQuestionPapers(selectedBookId,selectedChapterId||undefined)])
      .then(([chapterData,paperData])=>{if(current){setChapters(chapterData.chapters);setPapers(paperData.questionPapers);if(selectedChapterId&&!chapterData.chapters.some((chapter)=>chapter.id===selectedChapterId))setSelectedChapterId('');}})
      .catch((cause)=>{if(current){setError(getApiErrorMessage(cause));setPapers([]);setChapters([]);}});
    return()=>{current=false;};
  },[selectedBookId,selectedChapterId,quota?.used,refreshVersion]);
  useEffect(()=>{
    if(!activeAttempt)return;
    const timeout=setTimeout(()=>{void flushSave();},400);
    return()=>clearTimeout(timeout);
  },[answers,reviewQuestionIds,activeAttempt,flushSave]);
  useEffect(()=>{
    if(!activeAttempt?.id)return;
    const tick=()=>{const current=session.current;if(!current)return;const left=remainingSeconds(current.attempt.expiresAt,current.serverAnchor,performance.now()-current.monotonicAnchor);setSecondsLeft(left);if(!left&&performance.now()>=retryAt.current)void submitExam('timer_expired');};
    const timer=setInterval(tick,500);
    return()=>clearInterval(timer);
  },[activeAttempt?.id,submitExam]);
  useEffect(()=>{
    const subscription=AppState.addEventListener('change',(state)=>{
      if(state!=='active'){void flushSave();return;}
      const synchronize=async()=>{
        let current=session.current;
        if(!current){await refresh();return;}
        if(current.edit>current.saved&&remainingSeconds(current.attempt.expiresAt,current.serverAnchor,performance.now()-current.monotonicAnchor)>0){if(!await flushSave())return;}
        current=session.current;if(!current)return;
        try{const response=await examService.getAttempt(current.attempt.id);adopt(response.attempt,response.paper);}catch(cause){setError(getApiErrorMessage(cause));}
      };
      void synchronize();
    });
    return()=>subscription.remove();
  },[adopt,refresh,flushSave]);
  function selectAnswer(questionId:string,selectedOption:OptionKey){
    const current=session.current;if(!current||submitLock.current||secondsLeft<=0)return;
    current.answers={...current.answers,[questionId]:selectedOption};current.edit++;
    setAnswers(current.answers);setSaveMessage('Saving...');setError(null);
  }
  function toggleReview(questionId:string){
    const current=session.current;if(!current||submitLock.current||secondsLeft<=0)return;
    current.reviewQuestionIds=current.reviewQuestionIds.includes(questionId)?current.reviewQuestionIds.filter((id)=>id!==questionId):[...current.reviewQuestionIds,questionId];
    current.edit++;setReviewQuestionIds(current.reviewQuestionIds);setSaveMessage('Saving...');
  }
  async function startPaper(paper:QuestionPaperDto){
    if(submitLock.current)return;setLoading(true);setError(null);setResult(null);
    try{const response=await examService.startExam(paper.id);adopt(response.attempt,response.paper);setMessage(null);}catch(cause){setError(getApiErrorMessage(cause));}finally{setLoading(false);}
  }
  async function resumeAttempt(id:string){setLoading(true);setError(null);try{const response=await examService.getAttempt(id);adopt(response.attempt,response.paper);}catch(cause){setError(getApiErrorMessage(cause));}finally{setLoading(false);}}
  async function leaveAttempt(){if(submitLock.current)return;const saved=secondsLeft===0?true:await flushSave();if(!saved)return;session.current=null;setActiveAttempt(null);setActivePaper(null);setAnswers({});setMessage('You left the attempt. Its server timer continues; starting or saving did not use the daily allowance.');await refresh();}
  return {books,chapters,papers,attempts,selectedBookId,selectedChapterId,setSelectedBookId,setSelectedChapterId,activeAttempt,activePaper,answers,reviewQuestionIds,toggleReview,result,quota,loading,error,message,submitting,saving,saveMessage,secondsLeft,selectAnswer,startPaper,submitExam,leaveAttempt,resumeAttempt,refresh,flushSave};
}
