/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
function compile(file, resolve = require) {
  const module = { exports: {} };
  new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText)(resolve, module, module.exports);
  return module.exports;
}
const root = path.resolve(__dirname, '../../..');
const helpers = compile(path.join(root, 'features/auth/profile.helpers.ts'), (name) => compile(path.join(root, name.replace('@/', '') + '.ts')));
test('role-specific profile reveals only its applicable academic, guardian and access sections', () => {
  const user = { name: 'Student', email: 'student@example.test', role: 'MEMBER', className: 'HSC', group: 'BusinessStudies', academicYear: 2026, parent: { name: 'Guardian', phone: '01700000000', relation: 'Father' }, permissions: ['EXAM_MANAGE'] };
  assert.equal(helpers.profileSections(user).find((section) => section.title === 'Guardian contact').rows[0].value, 'Guardian');
  assert.equal(helpers.profileSections(user).find((section) => section.title === 'Academic details').rows[2].value, 'Business Studies (Commerce)');
  assert.deepEqual(helpers.profilePermissions(user), []);
  assert.equal(helpers.profileSections({ ...user, role: 'ADMIN' }).length, 1);
  assert.deepEqual(helpers.profilePermissions({ ...user, role: 'STAFF', permissions: ['CONTENT_READ', 'UNKNOWN'] }).map((item) => item.key), ['CONTENT_READ']);
});
test('missing data, long/Unicode names and UTC dates have honest stable presentation', () => {
  assert.equal(helpers.profileInitials('  Rezaul   Karim  '), 'RK');
  assert.equal(helpers.profileInitials('রেজাউল করিম'), 'রক');
  assert.equal(helpers.profileInitials(''), 'EQ');
  assert.equal(helpers.profileDate('invalid'), 'Not provided');
  assert.equal(helpers.profileDate('2005-01-02T00:00:00.000Z'), '2 Jan 2005');
  assert.ok(helpers.profileSections({ name: 'x', role: 'MEMBER' })[1].rows.every((row) => row.value === 'Not provided'));
});
test('password UX matches 10–128 backend length and prevents mismatch/reuse', () => {
  assert.ok(helpers.passwordChangeError('', 'NewPassword123!', 'NewPassword123!'));
  assert.ok(helpers.passwordChangeError('CurrentPassword123!', 'short', 'short'));
  assert.ok(helpers.passwordChangeError('CurrentPassword123!', 'CurrentPassword123!', 'CurrentPassword123!'));
  assert.ok(helpers.passwordChangeError('CurrentPassword123!', 'NewPassword123!', 'MismatchPassword'));
  assert.equal(helpers.passwordChangeError('CurrentPassword123!', 'NewPassword123!', 'NewPassword123!'), null);
});
function storeHarness() {
  let failure = false, clearCount = 0, access = 'access';
  const api = { changePassword: async () => { if (failure) throw Error('INVALID_CURRENT_PASSWORD'); }, logout: async () => {}, logoutAll: async () => { if (failure) throw Error('Offline'); } };
  const module = compile(path.join(root, 'store/stores/authStore.tsx'), (name) => {
    if (name === '@/services/authService') return { authService: api };
    if (name === '@/services/apiClient') return { setAccessToken: (value) => { access = value; } };
    if (name === '@/services/tokenStorage') return { clearRefreshToken: async () => { clearCount++; }, getRefreshToken: async () => null, saveRefreshToken: async () => {} };
    return require(name);
  });
  const store = module.useAuth;
  store.getState().setUser({ id: 'test', role: 'MEMBER' });
  return { store, fail: () => { failure = true; }, clears: () => clearCount, access: () => access };
}
test('failed password change retains session; successful change clears tokens and communicates re-login', async () => {
  const failed = storeHarness(); failed.fail();
  await assert.rejects(failed.store.getState().changePassword('wrong', 'UpdatedPassword123!'));
  assert.equal(failed.store.getState().user.id, 'test'); assert.equal(failed.clears(), 0);
  const ok = storeHarness(); await ok.store.getState().changePassword('CurrentPassword123!', 'UpdatedPassword123!');
  assert.equal(ok.store.getState().user, null); assert.equal(ok.access(), null); assert.equal(ok.clears(), 1);
  assert.equal(ok.store.getState().sessionNotice.tone, 'success');
});
test('logout-all distinguishes confirmed global revocation from offline local-only logout', async () => {
  const ok = storeHarness(); await ok.store.getState().logoutAll();
  assert.match(ok.store.getState().sessionNotice.message, /all devices/);
  const failed = storeHarness(); failed.fail(); await assert.rejects(failed.store.getState().logoutAll());
  assert.equal(failed.store.getState().user, null); assert.equal(failed.clears(), 1);
  assert.equal(failed.store.getState().sessionNotice.tone, 'warning');
  assert.match(failed.store.getState().sessionNotice.message, /Other devices could not/);
});
