import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { DiscoveryDto, LearningOverviewDto } from '@/models/api/LearningApi';
import { learningService } from '@/services/learningService';
import { getApiErrorMessage } from '@/services/apiClient';

export function useLearning(){
  const [overview,setOverview]=useState<LearningOverviewDto|null>(null),[discovery,setDiscovery]=useState<DiscoveryDto|null>(null);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const alive=useRef(true),lock=useRef(false),generation=useRef(0);
  const refresh=useCallback(async()=>{
    const request=++generation.current;setLoading(true);setError('');
    try{const [study,catalog]=await Promise.all([learningService.overview(),learningService.discovery()]);if(alive.current&&request===generation.current){setOverview(study);setDiscovery(catalog);}}
    catch(cause){if(alive.current&&request===generation.current)setError(getApiErrorMessage(cause));}
    finally{if(alive.current&&request===generation.current)setLoading(false);}
  },[]);
  useEffect(()=>{
    alive.current=true;
    return()=>{alive.current=false;};
  },[]);
  useFocusEffect(useCallback(()=>{void refresh();},[refresh]));
  async function reminder(id:string,enabled:boolean){
    if(lock.current)return;lock.current=true;setBusy(true);setError('');
    try{await learningService.reminder(id,enabled);if(alive.current)setDiscovery((d)=>d&&({...d,papers:d.papers.map((p)=>p.id===id?{...p,reminded:enabled}:p)}));}
    catch(cause){if(alive.current)setError(getApiErrorMessage(cause));}finally{lock.current=false;if(alive.current)setBusy(false);}
  }
  return {overview,discovery,loading,busy,error,refresh,reminder};
}
