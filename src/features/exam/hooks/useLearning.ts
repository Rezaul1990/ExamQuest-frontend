import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { DiscoveryDto, LearningOverviewDto } from '@/models/api/LearningApi';
import { learningService } from '@/services/learningService';
import { getApiErrorMessage } from '@/services/apiClient';

export function useLearning(){
  const [overview,setOverview]=useState<LearningOverviewDto|null>(null),[discovery,setDiscovery]=useState<DiscoveryDto|null>(null);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
  const [loadError,setLoadError]=useState(''),[actionError,setActionError]=useState(''),[message,setMessage]=useState('');
  const failedReminder=useRef<{id:string;enabled:boolean}|null>(null);
  const alive=useRef(true),lock=useRef(false),generation=useRef(0);
  const refresh=useCallback(async()=>{
    if(lock.current)return;
    const request=++generation.current;setLoading(true);setLoadError('');
    try{const [study,catalog]=await Promise.all([learningService.overview(),learningService.discovery()]);if(alive.current&&request===generation.current){setOverview(study);setDiscovery(catalog);}}
    catch(cause){if(alive.current&&request===generation.current)setLoadError(getApiErrorMessage(cause));}
    finally{if(alive.current&&request===generation.current)setLoading(false);}
  },[]);
  useEffect(()=>{
    alive.current=true;
    return()=>{alive.current=false;};
  },[]);
  useFocusEffect(useCallback(()=>{void refresh();},[refresh]));
  async function reminder(id:string,enabled:boolean){
    if(lock.current)return;lock.current=true;setBusy(true);setActionError('');setMessage('');failedReminder.current=null;
    try{await learningService.reminder(id,enabled);if(alive.current){setDiscovery((d)=>d&&({...d,papers:d.papers.map((p)=>p.id===id?{...p,reminded:enabled}:p)}));setMessage(enabled?'In-app reminder saved.':'In-app reminder removed.');}}
    catch(cause){if(alive.current){failedReminder.current={id,enabled};setActionError(getApiErrorMessage(cause));}}finally{lock.current=false;if(alive.current)setBusy(false);}
  }
  function retryReminder(){const failed=failedReminder.current;if(failed)void reminder(failed.id,failed.enabled);}
  return {overview,discovery,loading,busy,error:loadError||actionError,loadError,actionError,message,clearMessage:()=>setMessage(''),refresh,reminder,retryReminder};
}
