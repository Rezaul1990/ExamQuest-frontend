/* global __dirname */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const result={exports:{}};
new Function('module','exports',ts.transpileModule(fs.readFileSync(path.join(__dirname,'../learning.helpers.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(result,result.exports);
const {filterDiscovery,filterPractice,displayOption}=result.exports;
test('discovery search handles Bangla and reminder/upcoming intersections without mixing views',()=>{
  const papers=[{id:'open',title:'বাংলা পরীক্ষা',subject:'Bangla',reminded:true,upcoming:false},{id:'later',title:'Physics',subject:'SCIENCE',reminded:false,upcoming:true}];
  assert.deepEqual(filterDiscovery(papers,' বাংলা ','all').map((p)=>p.id),['open']);
  assert.deepEqual(filterDiscovery(papers,'science','upcoming').map((p)=>p.id),['later']);
  assert.deepEqual(filterDiscovery(papers,'Physics','reminders'),[]);
  assert.deepEqual(filterDiscovery(papers,'','reminders').map((p)=>p.id),['open']);
});
test('practice includes unanswered mistakes and separates correct bookmarks; option labels follow persisted shuffle',()=>{
  const questions=[{id:'wrong',isCorrect:false,bookmarked:false},{id:'saved',isCorrect:true,bookmarked:true},{id:'correct',isCorrect:true,bookmarked:false}];
  assert.deepEqual(filterPractice(questions,'mistakes').map((q)=>q.id),['wrong']);
  assert.deepEqual(filterPractice(questions,'bookmarks').map((q)=>q.id),['saved']);
  const shuffled={options:[{key:'C',label:'A',text:'Force'},{key:'A',label:'B',text:'Mass'}]};
  assert.equal(displayOption(shuffled,'A'),'B. Mass');assert.equal(displayOption(shuffled,'C'),'A. Force');assert.equal(displayOption(shuffled,undefined),'Not answered');
});
