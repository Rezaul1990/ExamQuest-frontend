/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const result = { exports: {} };
new Function('module', 'exports', ts.transpileModule(fs.readFileSync(path.join(__dirname, '../navigation.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(result, result.exports);
const { canOpenTab, canManageSection, tabConfig, workspaceHref } = result.exports;
const tabs = (user) => Object.keys(tabConfig).filter((tab) => canOpenTab(user, tab));
test('signed-out and Member cannot see management even with management permissions', () => {
  assert.deepEqual(tabs(null), []);
  const member = { role: 'MEMBER', permissions: ['EXAM_MANAGE', 'QUESTION_MANAGE', 'CONTENT_READ'] };
  assert.deepEqual(tabs(member), ['index', 'exams', 'results', 'profile']);
  assert.equal(canManageSection(member, 'import'), false);
});
test('Admin has five real destinations; Staff tools follow assigned permissions', () => {
  assert.deepEqual(tabs({ role: 'ADMIN' }), ['index', 'papers', 'staff', 'management', 'profile']);
  assert.deepEqual(tabs({ role: 'STAFF', permissions: [] }), ['index', 'profile']);
  assert.deepEqual(tabs({ role: 'STAFF', permissions: ['CONTENT_READ'] }), ['index', 'management', 'profile']);
  assert.deepEqual(tabs({ role: 'STAFF', permissions: ['EXAM_MANAGE'] }), ['index', 'papers', 'profile']);
  const staff = { role: 'STAFF', permissions: ['QUESTION_MANAGE'] };
  assert.equal(canManageSection(staff, 'import'), true);
  assert.equal(canManageSection(staff, 'question'), true);
  assert.equal(canManageSection(staff, 'chapters'), false);
  assert.equal(canManageSection(staff, 'staff'), false);
  assert.equal(canManageSection({ role: 'ADMIN' }, 'toString'), false);
});
test('dashboard actions resolve to shared route destinations', () => {
  assert.equal(workspaceHref('dashboard'), '/');
  assert.equal(workspaceHref('paper'), '/papers');
  assert.equal(workspaceHref('staff'), '/staff');
  assert.equal(workspaceHref('import'), '/management/import');
});
