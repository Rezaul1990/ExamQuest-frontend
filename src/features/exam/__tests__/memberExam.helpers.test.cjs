/* global __dirname */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const source=fs.readFileSync(path.join(__dirname,'../memberExam.helpers.ts'),'utf8');
const result={exports:{}};
new Function('module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(result,result.exports);
const {answersFromAttempt,remainingSeconds,countdownLabel}=result.exports;
test('countdown derives from server anchor and monotonic elapsed time, never client wall clock',()=>{
  const server=Date.parse('2026-10-15T10:00:00Z'),end='2026-10-15T10:01:00Z';
  assert.equal(remainingSeconds(end,server,0),60);assert.equal(remainingSeconds(end,server,15000),45);
  const original=Date.now;Date.now=()=>0;
  try{assert.equal(remainingSeconds(end,server,15000),45);}finally{Date.now=original;}
  assert.equal(remainingSeconds(end,server,120000),0);assert.equal(remainingSeconds(end,server,-1000),60);
});
test('saved unanswered rows do not become selected answers or expose grading state',()=>{
  const selected=answersFromAttempt({answers:[{questionId:'a',selectedOption:'B'},{questionId:'b'},{questionId:'c',selectedOption:'A',correctOption:'D'}]});
  assert.deepEqual(selected,{a:'B',c:'A'});assert.equal(selected.correctOption,undefined);
});
test('countdown renders clear minute/second boundaries',()=>{
  assert.equal(countdownLabel(0),'00:00');assert.equal(countdownLabel(59),'00:59');assert.equal(countdownLabel(60),'01:00');assert.equal(countdownLabel(3600),'60:00');
});
