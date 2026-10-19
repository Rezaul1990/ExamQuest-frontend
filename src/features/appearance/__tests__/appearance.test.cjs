/* global __dirname */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.resolve(__dirname,'../../..');
function load(file,deps={}) {
  const module={exports:{}};
  const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  new Function('module','exports','require',code)(module,module.exports,name=>name in deps?deps[name]:require(name));
  return module.exports;
}
const storeModule=()=>load('store/stores/appearanceStore.ts',{'react-native':{Platform:{OS:'web'}},'expo-secure-store':{}});
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};

test('device preference defaults to system; missing/corrupt persisted values safely fall back',async()=>{
  for(const value of [null,'broken','{"mode":"dark"}','system','light','dark']) {
    const {createAppearanceStore,parseAppearance}=storeModule();
    const store=createAppearanceStore({read:async()=>value,write:async()=>{}});
    assert.equal(store.getState().preference,'system');assert.equal(store.getState().hydrated,false);
    await store.getState().hydrate();
    assert.equal(store.getState().preference,parseAppearance(value));assert.equal(store.getState().hydrated,true);
    assert.equal(store.getState().error,'');
  }
});
test('late restoration cannot overwrite a user selection made while storage is reading',async()=>{
  const read=deferred(),writes=[];
  const store=storeModule().createAppearanceStore({read:()=>read.promise,write:async value=>writes.push(value)});
  const hydrate=store.getState().hydrate();
  await store.getState().setPreference('dark');read.resolve('light');await hydrate;
  assert.equal(store.getState().preference,'dark');assert.deepEqual(writes,['dark']);
});
test('rapid changes apply immediately and serialize persistence in selection order',async()=>{
  const first=deferred(),calls=[];let stored;
  const store=storeModule().createAppearanceStore({read:async()=>stored,write:async value=>{calls.push(value);if(value==='dark')await first.promise;stored=value;}});
  const dark=store.getState().setPreference('dark'),light=store.getState().setPreference('light'),system=store.getState().setPreference('system');
  assert.equal(store.getState().preference,'system');assert.equal(store.getState().saving,true);
  first.resolve();await Promise.all([dark,light,system]);
  assert.deepEqual(calls,['dark','light','system']);assert.equal(stored,'system');assert.equal(store.getState().saving,false);
});
test('failed save retains applied appearance and can retry without poisoning later writes',async()=>{
  let fail=true,stored;
  const store=storeModule().createAppearanceStore({read:async()=>stored,write:async value=>{if(fail)throw Error('blocked');stored=value;}});
  await store.getState().setPreference('dark');
  assert.equal(store.getState().preference,'dark');assert.equal(store.getState().failure,'save');assert.match(store.getState().error,/could not be saved/);
  fail=false;await store.getState().setPreference(store.getState().preference);
  assert.equal(stored,'dark');assert.equal(store.getState().error,'');assert.equal(store.getState().failure,null);
  const restored=storeModule().createAppearanceStore({read:async()=>stored,write:async()=>{}});await restored.getState().hydrate();assert.equal(restored.getState().preference,'dark');
});
test('failed restore remains usable and explicit retry restores preference',async()=>{
  let fail=true;
  const store=storeModule().createAppearanceStore({read:async()=>{if(fail)throw Error('blocked');return 'light';},write:async()=>{}});
  await store.getState().hydrate();assert.equal(store.getState().hydrated,true);assert.equal(store.getState().preference,'system');assert.equal(store.getState().failure,'restore');
  fail=false;await store.getState().hydrate();assert.equal(store.getState().preference,'light');assert.equal(store.getState().error,'');
});
const native={Platform:{select:x=>x.web??x.default},StyleSheet:{create:value=>value}};
const tokens=load('constants/theme.ts',{'react-native':native,'@/global.css':{}});
test('system reacts to scheme changes while explicit overrides ignore them',()=>{
  let preference='system',system='light';
  const hooks=load('hooks/use-theme.ts',{'@/constants/theme':tokens,'@/hooks/use-color-scheme':{useColorScheme:()=>system},react:{createContext:()=>({Provider:'Provider'}),useContext:()=>preference}});
  assert.equal(hooks.useThemeScheme(),'light');system='dark';assert.equal(hooks.useThemeScheme(),'dark');
  preference='light';assert.equal(hooks.useThemeScheme(),'light');system=null;assert.equal(hooks.useThemeScheme(),'light');
  preference='dark';assert.equal(hooks.useThemeScheme(),'dark');preference='system';assert.equal(hooks.useThemeScheme(),'light');
});
test('shared auth/learning styles select actual palette for panels, choices, fields, notices and dialogs',()=>{
  let mode='light';
  const deps={'react-native':native,'@/constants/theme':tokens,'@/hooks/use-theme':{useThemeScheme:()=>mode}};
  const auth=load('features/auth/Auth.styles.ts',deps),learning=load('features/exam/components/learning.styles.ts',deps);
  for(mode of ['light','dark']){
    const a=auth.useAuthStyles(),l=learning.useLearningStyles(),p=tokens.Colors[mode];
    for(const name of ['panel','listCard','dashboardCard'])assert.equal(a[name].backgroundColor,p.surface,name);
    assert.equal(a.screenShell.backgroundColor,p.background);assert.equal(a.input.color,p.textPrimary);
    assert.equal(a.error.backgroundColor,p.errorSoft);assert.equal(a.error.color,p.error);
    assert.equal(l.card.backgroundColor,p.surface);assert.equal(l.dialog.backgroundColor,p.surface);
    assert.equal(l.selected.backgroundColor,p.surfaceSelected);
  }
});
test('appearance controls preserve radio state and route retries to the failed storage operation',()=>{
  const calls=[];let vm={preference:'dark',hydrated:true,saving:false,error:'Save failed',failure:'save',setPreference:v=>calls.push(v),hydrate:()=>calls.push('restore')};
  const {AppearanceSettings}=load('features/appearance/AppearanceSettings.tsx',{'react-native':{View:'View'},'@/components/ui/ActionSurface':{ActionSurface:'Action'},'@/components/FeedbackNotice':{FeedbackNotice:'Feedback'},'@/components/themed-text':{ThemedText:'Text'},'@/constants/theme':tokens,'@/hooks/use-theme':{useTheme:()=>tokens.Colors.dark,useThemeScheme:()=> 'dark'},'@/store/stores/appearanceStore':{useAppearance:()=>vm}});
  const nodes=tree=>!tree||typeof tree!=='object'?[]:Array.isArray(tree)?tree.flatMap(nodes):[tree,...nodes(tree.props?.children)];
  let tree=nodes(AppearanceSettings());const radios=tree.filter(n=>n.type==='Action');
  assert.deepEqual(radios.map(n=>n.props.accessibilityState.checked),[false,false,true]);radios[0].props.onPress();assert.deepEqual(calls,['system']);
  tree.find(n=>n.type==='Feedback').props.onRetry();assert.deepEqual(calls,['system','dark']);
  vm={...vm,failure:'restore'};tree=nodes(AppearanceSettings());tree.find(n=>n.type==='Feedback').props.onRetry();assert.equal(calls.at(-1),'restore');
});
