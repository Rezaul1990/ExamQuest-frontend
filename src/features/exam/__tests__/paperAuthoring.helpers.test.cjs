/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync(require('node:path').join(__dirname, '../paperAuthoring.helpers.ts'), 'utf8');
const result = { exports: {} };
new Function('module', 'exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(result, result.exports);
const { changePaperSelection, eligibleBooks, emptyPaperSelection, paperDraftBlocker, summarizePaperAvailability, paperGenerationBlocker, importedPaperSource } = result.exports;
test('import handoff preselects exact imported IDs and chapters without mixing books',()=>{
  const rows=[{id:'one',bookId:'b1',chapterId:'c1'},{id:'two',bookId:'b1',chapterId:'c2'},{id:'other',bookId:'b2',chapterId:'c3'}];
  assert.deepEqual(importedPaperSource(rows),{bookId:'b1',chapterIds:['c1','c2'],questionIds:['one','two']});
  assert.deepEqual(importedPaperSource(rows,'b2'),{bookId:'b2',chapterIds:['c3'],questionIds:['other']});
  assert.equal(importedPaperSource([]),undefined);
  const selection={...emptyPaperSelection,bookId:'b1',groups:['Science'],chapterIds:['c1'],questionIds:['one']};
  assert.equal(paperDraftBlocker(selection,'Imported exam',1,true),null);
  assert.match(paperDraftBlocker({...selection,questionIds:[]},'Imported exam',0,true),/No active/);
  assert.equal(paperGenerationBlocker('50',50,false),null);
  assert.ok(!paperGenerationBlocker('100',50,false).includes('approved'));
});
test('50-question bank cannot generate 100 or use 13 medium questions as 50; approval/chapter counts remain distinct',()=>{
  const rows=[{chapterId:'c',difficulty:'easy',total:36,approved:36,pendingReview:0},{chapterId:'c',difficulty:'medium',total:13,approved:0,pendingReview:13},{chapterId:'c',difficulty:'hard',total:1,approved:1,pendingReview:0},{chapterId:'other',difficulty:'easy',total:100,approved:100,pendingReview:0}];
  assert.deepEqual(summarizePaperAvailability(rows,['c']),{total:50,approved:37,pendingReview:13});
  assert.deepEqual(summarizePaperAvailability(rows,['c'],'medium'),{total:13,approved:0,pendingReview:13});
  assert.match(paperGenerationBlocker('100',50),/only 50/);
  assert.match(paperGenerationBlocker('50',13),/Any difficulty/);
  assert.match(paperGenerationBlocker('13',0),/Approve questions/);
  assert.match(paperGenerationBlocker('0',50),/1 to 200/);
  assert.equal(paperGenerationBlocker('50',50),null);
});
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
