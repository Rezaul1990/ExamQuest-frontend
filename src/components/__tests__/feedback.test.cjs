/* global __dirname */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'../..');
function compile(file,deps={}) {
  const module={exports:{}};
  const source=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  new Function('module','exports','require',source)(module,module.exports,name=>name in deps?deps[name]:require(name));
  return module.exports;
}
const native={View:'View',Modal:'Modal',ScrollView:'ScrollView',ActivityIndicator:'Spinner',StyleSheet:{create:value=>value}};
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function harness(file,name,service,props={}) {
  const states=[],refs=[],effects=[];let stateIndex=0,refIndex=0,effectIndex=0;
  const react={
    useState(initial){const i=stateIndex++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return [states[i],value=>{states[i]=typeof value==='function'?value(states[i]):value;}];},
    useRef(initial){const i=refIndex++;return refs[i]??(refs[i]={current:initial});},
    useCallback:callback=>callback,
    useEffect(callback,deps){const i=effectIndex++,old=effects[i];if(!old||deps.some((v,j)=>!Object.is(v,old.deps[j]))){old?.cleanup?.();effects[i]={deps,cleanup:callback()};}},
  };
  const loaded=compile(file,{
    react,'react-native':native,'expo-router':{useFocusEffect:()=>{}},
    '@/services/learningService':{learningService:service},'@/services/apiClient':{getApiErrorMessage:error=>error.message},
    '@/components/FeedbackNotice':{FeedbackNotice:'Feedback'},'@/components/themed-text':{ThemedText:'Text'},
    '@/features/auth/components/AuthFields':{AuthButton:'Button',AuthTextField:'Input'},
    './QuestionReportButton':{QuestionReportButton:'Report'},'./learning.styles':{useLearningStyles:()=>({})},
  });
  return {render(){stateIndex=refIndex=effectIndex=0;return loaded[name](props);}};
}
function nodes(tree) {
  const found=[];
  function visit(node){if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(visit);return;}if(node.type==='Modal'&&!node.props.visible)return;found.push(node);visit(node.props?.children);}
  visit(tree);return found;
}
const button=(tree,label)=>nodes(tree).find(node=>node.type==='Button'&&node.props.label===label);
const feedback=(tree,kind)=>nodes(tree).filter(node=>node.type==='Feedback'&&node.props.kind===kind);

test('feedback announces loading/errors/success and retries only the explicit failed operation',()=>{
  const {FeedbackNotice}=compile('components/FeedbackNotice.tsx',{
    'react-native':native,'./themed-text':{ThemedText:'Text'},'@/features/auth/components/AuthFields':{AuthButton:'Button'},
    '@/constants/theme':{Radius:{md:8},Spacing:{three:16,two:8}},
    '@/hooks/use-theme':{useTheme:()=>({error:'error',errorSoft:'errorSoft',success:'success',successSoft:'successSoft',textPrimary:'text',surfaceSoft:'surface',border:'border'})},
  });
  const calls=[];
  const error=FeedbackNotice({kind:'error',title:'Loading failed',onRetry:()=>calls.push('retry'),retryLabel:'Retry reports',busy:true});
  assert.equal(error.props.accessibilityRole,'alert');assert.equal(error.props['aria-live'],'assertive');
  assert.equal(button(error,'Retry reports').props.disabled,true);
  const ready=FeedbackNotice({kind:'error',title:'Loading failed',onRetry:()=>calls.push('retry'),retryLabel:'Retry reports'});
  button(ready,'Retry reports').props.onPress();assert.deepEqual(calls,['retry']);
  for(const kind of ['empty','success','info']) assert.equal(nodes(FeedbackNotice({kind,title:'State',onRetry:()=>{}})).some(node=>node.type==='Button'),false);
  const loading=FeedbackNotice({kind:'loading',title:'Loading reports'});
  assert.equal(loading.props['aria-busy'],true);assert.equal(nodes(loading).find(node=>node.type==='Spinner').props.accessibilityLabel,'Loading reports');
});

test('API feedback preserves actionable domain errors while hiding unknown server messages',()=>{
  const api=compile('services/apiClient.ts',{'@/constants/Config':{Config:{apiBaseUrl:'http://example.test'}},'@/services/tokenStorage':{}});
  const message=(status,error,details)=>api.getApiErrorMessage(new api.ApiError(status,{success:false,error,details,message:'private database detail'}));
  assert.match(message(503,'SUBMISSION_UNCONFIRMED'),/same attempt/);
  assert.match(message(401,'AUTH_STALE'),/Sign in/);
  assert.match(message(403,'UNKNOWN'),/permission/);
  assert.match(message(429,'UNKNOWN'),/wait/);
  assert.match(message(500,'private connection details'),/temporarily unavailable/);
  assert.ok(!message(400,'PRIVATE_INTERNAL_CODE').includes('PRIVATE'));
  assert.match(message(422,'VALIDATION_ERROR',[{path:'name',message:'Required'}]),/name: Required/);
  assert.match(api.getApiErrorMessage(new TypeError('Failed to fetch')),/connection/);
});

test('learning panel never presents loading or failed catalog reads as empty',()=>{
  for(const [loading,loadError,discovery,expected] of [[true,'',null,0],[false,'Failed',null,0],[false,'Failed',{papers:[]},0],[false,'',{papers:[]},1]]) {
    const vm={loading,loadError,discovery,overview:null,busy:false,refresh:()=>{},actionError:'',message:''};
    const {StudentLearningPanel}=compile('features/exam/StudentLearningPanel.tsx',{
      react:{useState:initial=>[initial,()=>{}]},'react-native':native,'expo-router':{router:{}},
      '@/components/themed-text':{ThemedText:'Text'},'@/components/FeedbackNotice':{FeedbackNotice:'Feedback'},
      '@/features/auth/components/AuthFields':{AuthButton:'Button',AuthTextField:'Input'},
      './hooks/useLearning':{useLearning:()=>vm},'./learning.helpers':{filterDiscovery:()=>[]},
      './components/PracticePanel':{PracticePanel:'Practice'},'./components/learning.styles':{useLearningStyles:()=>({})},
    });
    assert.equal(feedback(StudentLearningPanel(),'empty').length,expected);
  }
});

test('reminder failures do not claim success; retry keeps exact id/intent and read failure remains separate',async()=>{
  let readFails=false,writeFails=true;const calls=[];
  const service={overview:async()=>{if(readFails)throw Error('Read failed');return {chapters:[]};},discovery:async()=>({papers:[{id:'p1',reminded:false}]}),reminder:async(...args)=>{calls.push(args);if(writeFails)throw Error('Save failed');}};
  const h=harness('features/exam/hooks/useLearning.ts','useLearning',service);
  await h.render().refresh();
  await h.render().reminder('p1',true);
  assert.equal(h.render().message,'');assert.equal(h.render().actionError,'Save failed');assert.equal(h.render().loadError,'');
  assert.equal(h.render().discovery.papers[0].reminded,false);
  writeFails=false;h.render().retryReminder();await settle();
  assert.deepEqual(calls,[['p1',true],['p1',true]]);assert.match(h.render().message,/saved/);
  assert.equal(h.render().discovery.papers[0].reminded,true);
  readFails=true;await h.render().refresh();
  assert.equal(h.render().loadError,'Read failed');assert.match(h.render().message,/saved/);
});

test('overlapping learning refreshes ignore stale responses',async()=>{
  const queue=[];
  const h=harness('features/exam/hooks/useLearning.ts','useLearning',{overview:()=>new Promise(resolve=>queue.push(resolve)),discovery:async()=>({papers:[]})});
  const first=h.render().refresh(),second=h.render().refresh();
  queue[1]({submissionCount:2});await second;
  queue[0]({submissionCount:1});await first;
  assert.equal(h.render().overview.submissionCount,2);
});

test('review loading retry cannot repeat a bookmark and success survives a later read failure',async()=>{
  let readFails=true,writeFails=true;const writes=[];
  const service={review:async()=>{if(readFails)throw Error('Review failed');return {available:true,message:'Review ready',questions:[{id:'q',text:'বাংলা',options:[],bookmarked:false}]};},bookmark:async(...args)=>{writes.push(args);if(writeFails)throw Error('Bookmark failed');}};
  const h=harness('features/exam/components/ResultReview.tsx','ResultReview',service,{attemptId:'a'});
  h.render();await settle();let tree=h.render();assert.equal(feedback(tree,'empty').length,0);assert.equal(feedback(tree,'error')[0].props.title,'Answer review could not load');
  readFails=false;feedback(tree,'error')[0].props.onRetry();h.render();await settle();tree=h.render();
  await button(tree,'Bookmark for practice').props.onPress();tree=h.render();assert.equal(feedback(tree,'success').length,0);
  writeFails=false;feedback(tree,'error').find(node=>node.props.title==='Bookmark update failed').props.onRetry();await settle();tree=h.render();
  assert.deepEqual(writes,[['a','q',true],['a','q',true]]);assert.equal(feedback(tree,'success').length,1);
  readFails=true;button(tree,'Refresh answer review').props.onPress();h.render();await settle();tree=h.render();
  assert.equal(writes.length,2);assert.equal(feedback(tree,'success').length,1);assert.equal(feedback(tree,'error')[0].props.title,'Answer review could not load');
});

test('reports show empty only after a successful read and Retry fetches the same list',async()=>{
  let fail=true;const calls=[];
  const h=harness('features/exam/components/AdminStudentTools.tsx','AdminQuestionReports',{reports:async(...args)=>{calls.push(args);if(fail)throw Error('List failed');return {reports:[],total:0};}});
  button(h.render(),'Review student question reports').props.onPress();h.render();await settle();let tree=h.render();
  assert.equal(feedback(tree,'empty').length,0);assert.equal(feedback(tree,'error').length,1);
  fail=false;feedback(tree,'error')[0].props.onRetry();h.render();await settle();tree=h.render();
  assert.deepEqual(calls,[[1,'open'],[1,'open']]);assert.equal(feedback(tree,'empty').length,1);
});

test('confirmed close plus failed refresh remains success; retry never closes again',async()=>{
  let closes=0,reads=0,readFails=true;
  const h=harness('features/exam/components/AdminStudentTools.tsx','CloseAndReleaseResults',{release:async()=>{closes++;}},
    {paper:{id:'p',status:'published',title:'Paper',durationMinutes:10},onChanged:async()=>{reads++;if(readFails)throw Error('Refresh failed');}});
  button(h.render(),'Close exam & schedule answer release').props.onPress();
  await button(h.render(),'Close exam and schedule review').props.onPress();let tree=h.render();
  assert.equal(feedback(tree,'success').length,1);assert.equal(feedback(tree,'error')[0].props.title,'Paper refresh failed after closing');
  assert.equal(button(tree,'Close exam & schedule answer release').props.disabled,true);
  readFails=false;await feedback(tree,'error')[0].props.onRetry();tree=h.render();
  assert.equal(closes,1);assert.equal(reads,2);assert.equal(feedback(tree,'error').length,0);
});
