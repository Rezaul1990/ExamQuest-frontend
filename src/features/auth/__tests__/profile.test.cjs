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
const apiErrors = compile(path.join(root, 'services/apiClient.ts'), (name) => {
  if (name === '@/constants/Config') return { Config: {} };
  if (name === '@/services/tokenStorage') return {};
  return require(name);
});
const feedback = compile(path.join(root, 'features/auth/authFeedback.ts'), (name) => name === '@/services/apiClient' ? apiErrors : require(name));
const academic = compile(path.join(root, 'constants/Academic.ts'));
const registration = compile(path.join(root, 'features/auth/register.helpers.ts'), (name) => {
  if (name === '@/constants/Academic') return academic;
  if (name === './authFeedback') return feedback;
  if (name === '@/services/apiClient') return apiErrors;
  return require(name);
});
const choices = compile(path.join(root, 'features/auth/components/AcademicChoices.tsx'), (name) => {
  if (name === 'react-native') return { View: 'View' };
  if (name === '@/components/ui/ActionSurface') return { ActionSurface: 'Action' };
  if (name === '@/components/themed-text') return { ThemedText: 'Text' };
  if (name === '../Auth.styles') return { useAuthStyles: () => ({}) };
  return require(name);
});

test('Bangla auth validation matches existing password/token bounds and never renders raw API details', () => {
  assert.ok(feedback.loginError('', ''));
  assert.ok(feedback.loginError('invalid', 'Password123!'));
  assert.equal(feedback.loginError('member@example.test', 'old'), null); // login retains legacy short-password support
  assert.equal(feedback.normalizeAuthEmail(' MEMBER@Example.test '), 'member@example.test');
  for (const action of ['reset-password', 'staff-invite']) {
    assert.ok(feedback.tokenActionError(action, '', 'short', 'Password123!'));
    assert.ok(feedback.tokenActionError(action, '', 'x'.repeat(30), 'short'));
    assert.equal(feedback.tokenActionError(action, '', 'x'.repeat(30), 'Password123!'), null);
  }
  for (const code of ['INVALID_CREDENTIALS', 'ACCOUNT_NOT_ACTIVE', 'INVALID_OR_EXPIRED_TOKEN', 'INVALID_OR_EXPIRED_INVITE', 'RATE_LIMITED', 'VALIDATION_ERROR', 'PRIVATE_INTERNAL']) {
    const text = feedback.authErrorMessage(new apiErrors.ApiError(400, { error: code, message: 'private-token', details: [{ path: 'token', message: 'private-token' }] }));
    assert.match(text, /[\u0980-\u09ff]/); assert.ok(!text.includes('private-token')); assert.ok(!text.includes(code));
  }
  assert.equal(feedback.authErrorMessage(new apiErrors.ApiError(401, { error: 'INVALID_CREDENTIALS' })), feedback.authErrorMessage(new apiErrors.ApiError(403, { error: 'ACCOUNT_NOT_ACTIVE' })));
});

function authScreenHarness(screen, service, action, token) {
  const states = [], refs = []; let si = 0, ri = 0; const routes = [];
  const stubs = {
    react: { useState(initial) { const i = si++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], (value) => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; }, useRef(initial) { const i = ri++; return refs[i] ?? (refs[i] = { current: initial }); } },
    'expo-router': { Link: 'Link', router: { replace: (url) => routes.push(url) }, useLocalSearchParams: () => ({ token }) },
    'react-native': { ScrollView: 'Scroll', View: 'View', Pressable: 'Pressable' },
    '@/components/themed-text': { ThemedText: 'Text' }, '@/components/themed-view': { ThemedView: 'View' },
    '@/components/FeedbackNotice': { FeedbackNotice: 'Feedback' }, '@/constants/Routes': { Routes: { home: '/', login: '/login', register: '/register', forgotPassword: '/forgot-password' } },
    '@/features/auth/Auth.styles': { useAuthStyles: () => ({}) }, '@/features/auth/components/AuthFields': { AuthButton: 'Button', AuthTextField: 'Input', AuthHero: 'Hero', FormStepHeader: 'Step' },
    '@/components/ui/ActionSurface': { ActionSurface: 'Action' }, '@/constants/Academic': academic, './register.helpers': registration,
    './components/AcademicChoices': choices,
    '@/store': { useAuth: () => ({ login: service.login }) }, '@/features/appearance/AppearanceSettings': { AppearanceSettings: 'Appearance' },
    '@/services/authService': { authService: service }, './authFeedback': feedback,
  };
  const module = compile(path.join(root, `features/auth/${screen}.tsx`), (name) => Object.hasOwn(stubs, name) ? stubs[name] : require(name));
  return { routes, choices: module.RegistrationChoices, render() { si = ri = 0; return module[screen]({ action }); } };
}
function authNodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(authNodes);
  return [tree, ...authNodes(tree.props?.children)];
}
const input = (tree, label) => authNodes(tree).find((node) => node.type === 'Input' && node.props.label === label);
const submitButton = (tree) => authNodes(tree).find((node) => node.type === 'Button');

function editorHarness(service) {
  const states = [], refs = []; let si = 0, ri = 0;
  let user = { id: 'member', role: 'MEMBER', educationLevel: 'HSC', className: 'HSC', group: 'Science', academicYear: 2026, academicProfileRevision: 0 };
  const updates = [], store = { getState: () => ({ user, setUser: (value) => { user = value; updates.push(value); } }) };
  const deps = {
    react: { useState(initial) { const i = si++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], (value) => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; }, useRef(initial) { const i = ri++; return refs[i] ?? (refs[i] = { current: initial }); } },
    'react-native': { View: 'View' }, '@/store': { useAuth: store }, '@/constants/Academic': academic,
    '@/components/FeedbackNotice': { FeedbackNotice: 'Feedback' }, '@/components/themed-text': { ThemedText: 'Text' },
    '@/services/authService': { authService: service }, '@/services/apiClient': apiErrors,
    '../Auth.styles': { useAuthStyles: () => ({}) }, '../register.helpers': registration, '../authFeedback': feedback,
    './AcademicChoices': { AcademicChoices: 'Choices' }, './AuthFields': { AuthButton: 'Button', AuthTextField: 'Input' },
  };
  const { AcademicProfileEditor } = compile(path.join(root, 'features/auth/components/AcademicProfileEditor.tsx'), (name) => Object.hasOwn(deps, name) ? deps[name] : require(name));
  return { updates, switchUser: (value) => { user = value; }, render() { si = ri = 0; return AcademicProfileEditor({ user }); } };
}
const namedButton = (tree, label) => authNodes(tree).find((n) => n.type === 'Button' && n.props.label === label);

test('academic editor requires confirmation, preserves retry input and locks pending saves before updating safe user', async () => {
  let resolve, reject; const payloads = [];
  const h = editorHarness({ updateAcademicProfile: (payload) => { payloads.push(payload); return new Promise((ok, fail) => { resolve = ok; reject = fail; }); } });
  let tree = h.render(); namedButton(tree, 'শিক্ষার তথ্য সম্পাদনা').props.onPress(); tree = h.render();
  authNodes(tree).find((n) => n.type === 'Choices' && n.props.label === 'বিভাগ').props.onSelect('Humanities');
  input(tree, 'শিক্ষাবর্ষ').props.onChangeText('২০২৭'); tree = h.render();
  namedButton(tree, 'পরিবর্তন পর্যালোচনা').props.onPress(); tree = h.render(); assert.equal(payloads.length, 0);
  namedButton(tree, 'বাতিল').props.onPress(); tree = h.render(); assert.equal(payloads.length, 0);
  namedButton(tree, 'শিক্ষার তথ্য সম্পাদনা').props.onPress(); tree = h.render(); assert.equal(input(tree, 'শিক্ষাবর্ষ').props.value, '2026');
  authNodes(tree).find((n) => n.type === 'Choices' && n.props.label === 'বিভাগ').props.onSelect('Humanities');
  input(tree, 'শিক্ষাবর্ষ').props.onChangeText('২০২৭'); tree = h.render(); namedButton(tree, 'পরিবর্তন পর্যালোচনা').props.onPress(); tree = h.render();
  const pending = namedButton(tree, 'নিশ্চিত করে সংরক্ষণ').props.onPress(); await namedButton(tree, 'নিশ্চিত করে সংরক্ষণ').props.onPress();
  assert.equal(payloads.length, 1); assert.deepEqual(payloads[0], { educationLevel:'HSC',className:'HSC',group:'Humanities',academicYear:2027,expectedRevision:0,confirmed:true });
  tree = h.render(); assert.equal(namedButton(tree, 'বাতিল').props.disabled, true);
  reject(new apiErrors.ApiError(409, { error:'ACADEMIC_PROFILE_CHANGED' })); await pending; tree = h.render();
  assert.equal(h.updates.length, 0); assert.match(authNodes(tree).find((n) => n.type === 'Feedback').props.message, /refresh/);
  const retry = namedButton(tree, 'নিশ্চিত করে সংরক্ষণ').props.onPress();
  resolve({ user:{ id:'member',role:'MEMBER',educationLevel:'HSC',className:'HSC',group:'Humanities',academicYear:2027,academicProfileRevision:1 } }); await retry;
  tree = h.render(); assert.equal(h.updates[0].group, 'Humanities'); assert.ok(namedButton(tree, 'শিক্ষার তথ্য সম্পাদনা'));
  assert.equal(authNodes(tree).find((n) => n.type === 'Feedback').props.kind, 'success');
});

test('late academic-save response cannot replace a different signed-in account', async () => {
  let resolve;
  const h = editorHarness({ updateAcademicProfile: () => new Promise((ok) => { resolve = ok; }) });
  let tree = h.render(); namedButton(tree, 'শিক্ষার তথ্য সম্পাদনা').props.onPress(); tree = h.render(); namedButton(tree, 'পরিবর্তন পর্যালোচনা').props.onPress(); tree = h.render();
  const pending = namedButton(tree, 'নিশ্চিত করে সংরক্ষণ').props.onPress(); h.switchUser({ id:'other',role:'ADMIN' });
  resolve({ user:{ id:'member',role:'MEMBER',academicProfileRevision:1 } }); await pending;
  assert.equal(h.updates.length, 0); assert.equal(h.render(), null);
});

test('profile refresh cannot overwrite a newer academic revision saved while GET was pending', async () => {
  let user = { id:'member',academicProfileRevision:0 }, resolve; const updates = [];
  const store = Object.assign(() => ({ user, setUser: (value) => updates.push(value) }), { getState: () => ({ user }) });
  const deps = {
    react: { useState: (value) => [value, () => {}], useRef: (value) => ({current:value}), useCallback: (callback) => callback },
    'expo-router': { useFocusEffect: (callback) => callback() }, '@/store': { useAuth: store },
    '@/services/authService': { authService: { me: () => new Promise((ok) => { resolve = ok; }) } },
    '@/services/apiClient': { getApiErrorMessage: () => 'safe error' }, '../profile.helpers': { passwordChangeError: () => null },
  };
  const { useProfile: runProfile } = compile(path.join(root, 'features/auth/hooks/useProfile.ts'), (name) => Object.hasOwn(deps, name) ? deps[name] : require(name));
  runProfile(); user = { id:'member',academicProfileRevision:2 }; resolve({ user:{ id:'member',academicProfileRevision:1 } });
  await new Promise((done) => setImmediate(done)); assert.equal(updates.length, 0);
});

test('a late exam catalog refresh cannot restore eligibility from before a newer profile refresh', async () => {
  const states = [], refs = [], reads = []; let si = 0, ri = 0;
  const react = { useState(initial) { const i = si++; if (!(i in states)) states[i] = initial; return [states[i], (value) => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; }, useRef(initial) { const i = ri++; return refs[i] ?? (refs[i] = {current:initial}); }, useCallback: (callback) => callback, useEffect: () => {} };
  const deps = { react, 'react-native': {}, 'expo-router': { useFocusEffect: () => {} },
    '@/services/apiClient': { ApiError: apiErrors.ApiError, getApiErrorMessage: () => 'safe error' }, '../memberExam.helpers': {},
    '@/services/examService': { examService: { listBooks: () => new Promise((resolve) => reads.push(resolve)), listAttempts: async () => ({attempts:[]}), examStatus: async () => ({used:0}) } },
  };
  const { useMemberExam: runExam } = compile(path.join(root, 'features/exam/hooks/useMemberExam.ts'), (name) => Object.hasOwn(deps, name) ? deps[name] : require(name));
  const render = () => { si = ri = 0; return runExam(); };
  const first = render().refresh(), second = render().refresh();
  reads[1]({books:[{id:'new-group'}]}); await second; assert.equal(render().books[0].id,'new-group');
  reads[0]({books:[{id:'old-group'}]}); await first; assert.equal(render().books[0].id,'new-group');
});

const validRegistration = { name: ' Student Test ', email: ' STUDENT@Example.test ', phone: '01700000000', password: 'Password123!', confirmPassword: 'Password123!', educationLevel: 'SSC', className: ' ssc ', group: 'Science', academicYear: '২০২৬', parentName: 'Guardian Test', parentPhone: '01700000001', parentEmail: '', parentRelation: 'Guardian' };
test('registration academic/guardian validation retains canonical payloads and rejects invalid years', () => {
  assert.equal(registration.registrationError(validRegistration), null);
  const payload = registration.registrationPayload(validRegistration);
  assert.equal(payload.className, 'SSC'); assert.equal(payload.academicYear, 2026); assert.equal(payload.email, 'student@example.test');
  for (const year of ['', '1999', '2101', '2026.5', '2e3', '2026extra', '20 26']) assert.ok(registration.registrationError({ ...validRegistration, academicYear: year }));
  for (const year of ['2000', '2100', '২০২৬']) assert.equal(registration.registrationError({ ...validRegistration, academicYear: year }), null);
  for (const patch of [{ educationLevel: 'BSC' }, { className: 'HSC' }, { group: '' }, { group: 'Arts' }, { parentName: '' }, { parentPhone: '' }, { parentEmail: 'invalid' }, { parentRelation: 'Unknown' }]) assert.ok(registration.registrationError({ ...validRegistration, ...patch }));
  assert.equal(registration.registrationPayload({ ...validRegistration, className: ' Class 10 ' }).className, 'Class 10');
});

test('registration SSC/HSC selectors, retry/pending lock and success use actual request composition', async () => {
  for (const level of academic.educationLevels) {
    let resolve, reject; const payloads = [];
    const h = authScreenHarness('RegisterScreen', { register: (payload) => { payloads.push(payload); return new Promise((ok, fail) => { resolve = ok; reject = fail; }); } });
    let tree = h.render(); await submitButton(tree).props.onPress(); assert.equal(payloads.length, 0);
    const fields = { 'Full name': 'Student Test', Email: ' STUDENT@Example.test ', Phone: '01700000000', Password: 'Password123!', 'Confirm password': 'Password123!', 'Guardian name': 'Guardian Test', 'Guardian phone': '01700000001', 'শিক্ষাবর্ষ': '২০২৬' };
    for (const [label, value] of Object.entries(fields)) input(tree, label).props.onChangeText(value);
    tree = h.render();
    const choice = (label) => authNodes(tree).find((n) => n.props?.label === label && n.props?.options);
    choice('শিক্ষার স্তর').props.onSelect(level); choice('বিভাগ').props.onSelect('BusinessStudies'); tree = h.render();
    assert.equal(input(tree, 'শ্রেণি / বর্ষ').props.value, level);
    const pending = submitButton(tree).props.onPress(); await submitButton(tree).props.onPress(); assert.equal(payloads.length, 1);
    assert.equal(payloads[0].educationLevel, level); assert.equal(payloads[0].className, level); assert.equal(payloads[0].group, 'BusinessStudies'); assert.equal(payloads[0].academicYear, 2026);
    tree = h.render(); assert.equal(submitButton(tree).props.busy, true); assert.ok(authNodes(tree).filter((n) => n.type === 'Input').every((n) => n.props.editable === false));
    reject(new apiErrors.ApiError(503, { error: 'PRIVATE' })); await pending; tree = h.render(); assert.equal(input(tree, 'শিক্ষাবর্ষ').props.value, '2026');
    const retry = submitButton(tree).props.onPress(); resolve({ message: 'private server text' }); await retry; tree = h.render();
    assert.equal(input(tree, 'Password').props.value, ''); assert.equal(submitButton(tree).props.label, 'লগইন করুন');
    assert.equal(authNodes(tree).find((n) => n.type === 'Feedback').props.kind, 'success'); submitButton(tree).props.onPress(); assert.deepEqual(h.routes, ['/login']);
  }
});

test('registration choices expose checked radios through the existing shared action surface', () => {
  const h = authScreenHarness('RegisterScreen', {}); const selected = [];
  const tree = h.choices({ label: 'শিক্ষার স্তর', options: academic.educationLevels.map((value) => ({ value, label: value })), selected: 'HSC', disabled: true, onSelect: (value) => selected.push(value) });
  assert.equal(tree.props.accessibilityRole, 'radiogroup');
  const actions = authNodes(tree).filter((n) => n.type === 'Action');
  assert.deepEqual(actions.map((n) => n.props.accessibilityState.checked), [false, true]); assert.ok(actions.every((n) => n.props.disabled));
});

test('login validates locally, locks duplicate keyboard/button submit, retains values on failure and retries real login', async () => {
  let calls = 0, reject; const args = [];
  const service = { login: (...values) => { calls++; args.push(values); return new Promise((_, r) => { reject = r; }); } };
  const h = authScreenHarness('LoginScreen', service); let tree = h.render();
  await submitButton(tree).props.onPress(); assert.equal(calls, 0);
  input(tree, 'ইমেইল').props.onChangeText(' MEMBER@Example.test '); input(tree, 'পাসওয়ার্ড').props.onChangeText('Password123!'); tree = h.render();
  const pending = submitButton(tree).props.onPress(); await input(tree, 'পাসওয়ার্ড').props.onSubmitEditing();
  assert.equal(calls, 1); assert.deepEqual(args[0], ['member@example.test', 'Password123!']);
  tree = h.render(); assert.equal(submitButton(tree).props.busy, true); assert.equal(input(tree, 'ইমেইল').props.editable, false);
  reject(new apiErrors.ApiError(401, { error: 'INVALID_CREDENTIALS', message: 'private' })); await pending; tree = h.render();
  assert.equal(input(tree, 'পাসওয়ার্ড').props.value, 'Password123!'); assert.ok(authNodes(tree).some((n) => n.type === 'Feedback' && n.props.kind === 'error'));
  service.login = async () => { calls++; }; tree = h.render(); await submitButton(tree).props.onPress(); assert.deepEqual(h.routes, ['/']);
});

test('forgot password uses generic local success and keeps failures retryable without exposing server content', async () => {
  let fail = true, calls = 0;
  const h = authScreenHarness('TokenActionScreen', { forgotPassword: async (email) => { calls++; assert.equal(email, 'member@example.test'); if (fail) throw Error('private SMTP token'); return { message: 'private response' }; } }, 'forgot-password');
  let tree = h.render(); await submitButton(tree).props.onPress(); assert.equal(calls, 0);
  input(tree, 'ইমেইল').props.onChangeText(' MEMBER@Example.test '); tree = h.render(); await submitButton(tree).props.onPress(); tree = h.render();
  assert.ok(authNodes(tree).some((n) => n.type === 'Feedback' && n.props.kind === 'error'));
  fail = false; await submitButton(tree).props.onPress(); tree = h.render();
  assert.equal(authNodes(tree).find((n) => n.type === 'Feedback').props.message, feedback.tokenActionSuccess['forgot-password']);
});

test('reset/invite/verification mask link tokens, retain failed input and require login after success', async () => {
  for (const [action, method] of [['reset-password', 'resetPassword'], ['staff-invite', 'acceptStaffInvite'], ['verify-email', 'verifyEmail']]) {
    let fail = true, calls = 0; const token = 'test-security-token-only-123456';
    const h = authScreenHarness('TokenActionScreen', { [method]: async (received) => { calls++; assert.equal(received, token); if (fail) throw new apiErrors.ApiError(400, { error: action === 'staff-invite' ? 'INVALID_OR_EXPIRED_INVITE' : 'INVALID_OR_EXPIRED_TOKEN' }); return { user: { role: 'STAFF' } }; } }, action, token);
    let tree = h.render(); assert.equal(input(tree, 'নিরাপত্তা কোড').props.secureTextEntry, true);
    if (action !== 'verify-email') input(tree, 'নতুন পাসওয়ার্ড').props.onChangeText('Password123!');
    tree = h.render(); await submitButton(tree).props.onPress(); tree = h.render(); assert.equal(input(tree, 'নিরাপত্তা কোড').props.value, token);
    fail = false; await submitButton(tree).props.onPress(); tree = h.render();
    assert.equal(input(tree, 'নিরাপত্তা কোড'), undefined); assert.equal(calls, 2); assert.equal(authNodes(tree).find((n) => n.type === 'Feedback').props.kind, 'success');
    assert.equal(submitButton(tree).props.label, 'লগইনে ফিরুন'); submitButton(tree).props.onPress(); assert.deepEqual(h.routes, ['/login']);
  }
});

test('token actions reject multi-value links and serialize pending requests before disabling UI', async () => {
  let calls = 0, resolve;
  const service = { resetPassword: () => { calls++; return new Promise((done) => { resolve = done; }); } };
  const invalid = authScreenHarness('TokenActionScreen', service, 'reset-password', ['first', 'second']);
  let tree = invalid.render(); assert.equal(input(tree, 'নিরাপত্তা কোড').props.value, '');
  await submitButton(tree).props.onPress(); assert.equal(calls, 0);
  const h = authScreenHarness('TokenActionScreen', service, 'reset-password', 'test-only-reset-token-123456');
  tree = h.render(); input(tree, 'নতুন পাসওয়ার্ড').props.onChangeText('Password123!'); tree = h.render();
  const pending = submitButton(tree).props.onPress(); await submitButton(tree).props.onPress(); assert.equal(calls, 1);
  tree = h.render(); assert.equal(submitButton(tree).props.busy, true);
  assert.ok(authNodes(tree).filter((n) => n.type === 'Input').every((n) => n.props.editable === false));
  assert.equal(authNodes(tree).find((n) => n.type === 'Button' && n.props.label === 'লগইনে ফিরুন').props.disabled, true);
  resolve({ message: 'untrusted response' }); await pending;
  assert.equal(authNodes(h.render()).find((n) => n.type === 'Feedback').props.message, feedback.tokenActionSuccess['reset-password']);
});
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
