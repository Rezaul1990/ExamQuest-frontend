/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync(require('node:path').join(__dirname, '../paperAuthoring.helpers.ts'), 'utf8');
const result = { exports: {} };
new Function('module', 'exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(result, result.exports);
const { changePaperSelection, eligibleBooks, emptyPaperSelection, paperDraftBlocker } = result.exports;
const workflow = { exports: {} };
const workflowSource = fs.readFileSync(require('node:path').join(__dirname, '../../../services/questionReviewWorkflow.ts'), 'utf8');
new Function('module', 'exports', ts.transpileModule(workflowSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(workflow, workflow.exports);
test('confirmed page approval follows ordered transitions and returned revisions; skips inactive/approved rows',async()=>{
  const calls=[];
  const result=await workflow.exports.approveListedQuestions([
    {id:'draft',status:'active',reviewStatus:'draft',revision:3},
    {id:'reviewed',status:'active',reviewStatus:'reviewed',revision:7},
    {id:'approved',status:'active',reviewStatus:'approved',revision:1},
    {id:'inactive',status:'inactive',reviewStatus:'draft',revision:1},
  ],async(id,status,revision)=>{calls.push([id,status,revision]);return {question:{id,reviewStatus:status,revision:revision+1}};});
  assert.deepEqual(calls,[['draft','reviewed',3],['draft','approved',4],['reviewed','approved',7]]);
  assert.equal(result.approvedCount,2);assert.equal(result.requestedCount,2);assert.equal(result.error,undefined);
});
test('page approval stops on stale/error response and reports accepted count without claiming remaining approvals',async()=>{
  const calls=[],failure=Error('revision conflict');
  const result=await workflow.exports.approveListedQuestions(['one','stale','untouched'].map(id=>({id,status:'active',reviewStatus:'reviewed',revision:1})),async(id)=>{calls.push(id);if(id==='stale')throw failure;return {question:{id,revision:2}};});
  assert.deepEqual(calls,['one','stale']);assert.equal(result.approvedCount,1);assert.equal(result.requestedCount,3);assert.equal(result.error,failure);
});
test('draft save explains pending approval versus unselected questions and missing title',()=>{
  const selected={className:'HSC',groups:['Science'],subject:'Physics',bookId:'b',chapterIds:['c'],questionIds:[]};
  assert.match(paperDraftBlocker(emptyPaperSelection,'Paper',0),/Select class/);
  assert.match(paperDraftBlocker({...selected,chapterIds:[]},'Paper',0),/chapter/);
  assert.match(paperDraftBlocker(selected,'Paper',0),/Imported questions start as draft/);
  assert.match(paperDraftBlocker(selected,'Paper',3),/Generate selection/);
  assert.match(paperDraftBlocker({...selected,questionIds:['q']},' ',3),/title/);
  assert.equal(paperDraftBlocker({...selected,questionIds:['q']},'Paper',3),null);
});
const books = [
  { id:'science', title:'Biology', subject:'Biology', className:'HSC', group:'Science', status:'published' },
  { id:'shared', title:'ICT', subject:'ICT', className:'HSC', group:'Science', eligibleGroups:['Science','Humanities','BusinessStudies'], status:'published' },
  { id:'wrongclass', title:'ICT SSC', subject:'ICT', className:'SSC', group:'Science', status:'published' },
];
test('group selection is required; wrong class and incompatible multi-group books excluded',()=>{
  assert.equal(eligibleBooks(books,{...emptyPaperSelection,className:'HSC'}).length,0);
  const selected=eligibleBooks(books,{...emptyPaperSelection,className:'HSC',groups:['Science','Humanities']});
  assert.deepEqual(selected.map((book)=>book.id),['shared']);
});
test('changing upstream audience clears stale subject/book/chapter/questions',()=>{
  const current={className:'HSC',groups:['Science'],subject:'Biology',bookId:'science',chapterIds:['c1'],questionIds:['q1']};
  assert.deepEqual(changePaperSelection(current,'groups',['Humanities']),{...current,groups:['Humanities'],subject:'',bookId:'',chapterIds:[],questionIds:[]});
  assert.deepEqual(changePaperSelection(current,'className','SSC'),{...emptyPaperSelection,className:'SSC'});
  assert.deepEqual(changePaperSelection(current,'bookId','shared').questionIds,[]);
});
