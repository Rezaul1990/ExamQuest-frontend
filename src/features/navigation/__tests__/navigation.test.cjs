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

function loadComponent(relative, stubs) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function('module', 'exports', 'require', code)(module, module.exports, (name) => {
    if (Object.hasOwn(stubs, name)) return stubs[name];
    if (name === 'react/jsx-runtime') return require(name);
    throw new Error(`Unexpected dependency: ${name}`);
  });
  return module.exports;
}

function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
function hookState() {
  const state = [], refs = [], effects = []; let si = 0, ri = 0, ei = 0;
  return {
    reset() { si = ri = ei = 0; },
    cleanup() { effects.forEach((effect) => effect.cleanup?.()); },
    react: {
      useState(initial) { const i = si++; if (!(i in state)) state[i] = initial; return [state[i], (value) => { state[i] = value; }]; },
      useRef(initial) { const i = ri++; return refs[i] ?? (refs[i] = { current: initial }); },
      useCallback: (callback) => callback, useMemo: (factory) => factory(),
      useEffect(callback, deps) { const i = ei++, old = effects[i]; if (!old || deps.some((v, j) => !Object.is(v, old.deps[j]))) { old?.cleanup?.(); effects[i] = { deps, cleanup: callback() }; } },
    },
  };
}

test('shared header respects landscape safe areas and dismisses keyboard before Back and account actions', () => {
  const h = hookState(), calls = [];
  const { AppHeaderBar } = loadComponent('../../../components/AppHeaderBar.tsx', {
    react: h.react, 'react-native': { View: 'View', Modal: 'Modal', Pressable: 'Scrim', Keyboard: { dismiss: () => calls.push('keyboard') }, StyleSheet: { create: (s) => s } },
    'expo-symbols': { SymbolView: 'Symbol' }, 'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 24, left: 30, right: 18 }) },
    '@/components/themed-text': { ThemedText: 'Text' }, '@/components/ui/ActionSurface': { ActionSurface: 'Action' },
    '@/constants/theme': { ControlSize: { header: 56, touch: 44 }, Elevation: {}, Radius: {}, Spacing: { three: 16 } },
    '@/hooks/use-theme': { useTheme: () => ({}) }, '@/store': { useAuth: () => ({ user: { id: 'member', name: 'Member', role: 'MEMBER' }, logout: async () => { calls.push('logout'); } }) },
  });
  const props = { title: 'Questions', canGoBack: true, onBack: () => calls.push('back'), onProfile: () => calls.push('profile') };
  const render = () => { h.reset(); return AppHeaderBar(props); };
  let tree = render();
  assert.deepEqual([tree.props.style.paddingTop, tree.props.style.paddingLeft, tree.props.style.paddingRight], [24, 30, 18]);
  const action = (label) => nodes(tree).find((n) => n.props?.accessibilityLabel === label);
  action('Go back').props.onPress(); assert.deepEqual(calls.splice(0), ['keyboard', 'back']);
  action('Open account menu').props.onPress(); tree = render();
  assert.equal(nodes(tree).find((n) => n.type === 'Modal').props.visible, true);
  action('Open profile').props.onPress(); tree = render();
  assert.deepEqual(calls.splice(0), ['keyboard', 'keyboard', 'profile']);
  assert.equal(nodes(tree).find((n) => n.type === 'Modal').props.visible, false);
  action('Logout').props.onPress(); assert.deepEqual(calls, ['keyboard', 'logout']);
});

test('active-exam header exposes neither Back nor Profile callbacks', () => {
  let active = false; const calls = [];
  const { NavigationHeader } = loadComponent('../NavigationHeader.tsx', {
    'expo-router': { router: { navigate: (url) => calls.push(url) } }, '@/components/AppHeaderBar': { AppHeaderBar: 'Header' },
    './ExamNavigationContext': { useExamNavigation: () => ({ active }) },
  });
  const normal = NavigationHeader({ title: 'Books', canGoBack: true, onBack: () => calls.push('back') });
  normal.props.onBack(); normal.props.onProfile(); assert.deepEqual(calls, ['back', '/profile']);
  active = true;
  const guarded = NavigationHeader({ title: 'Exams', canGoBack: true, onBack: () => calls.push('bypass') });
  assert.equal(guarded.props.title, 'Exam in progress'); assert.equal(guarded.props.hideMenu, true);
  assert.equal(guarded.props.canGoBack, false); assert.equal(guarded.props.onBack, undefined); assert.equal(guarded.props.onProfile, undefined);
});

test('Management deep links seed index and shared Back retains history or uses Management fallback', () => {
  const calls = [], Stack = Object.assign(() => null, { Screen: 'Screen' });
  const layout = loadComponent('../../../app/(app)/management/_layout.tsx', {
    'expo-router': { Stack, router: { replace: (url) => calls.push(url) } },
    '@/features/navigation/NavigationHeader': { NavigationHeader: 'Header' }, '@/features/navigation/navigation': result.exports,
  });
  assert.equal(layout.unstable_settings.initialRouteName, 'index');
  const tree = layout.default(), header = tree.props.screenOptions.header;
  const input = { options: { title: 'Books' }, route: { name: '[section]' }, navigation: { goBack: () => calls.push('history') } };
  header({ ...input, back: {} }).props.onBack(); header(input).props.onBack();
  assert.deepEqual(calls, ['history', '/management']);
  assert.equal(header({ ...input, route: { name: 'index' } }).props.canGoBack, false);
});

function guardHarness(platform) {
  const h = hookState(); let active = true, hardware, unload, removal, focusCleanup;
  const cleanups = [], published = [];
  const windowStub = { addEventListener: (_, callback) => { unload = callback; }, removeEventListener: () => cleanups.push('unload') };
  const previousWindow = globalThis.window; globalThis.window = windowStub;
  const { useExamNavigationGuard: runGuard } = loadComponent('../useExamNavigationGuard.ts', {
    react: h.react, 'react-native': { Platform: { OS: platform }, BackHandler: { addEventListener: (_, callback) => { hardware = callback; return { remove: () => cleanups.push('hardware') }; } } },
    'expo-router': { useFocusEffect: (callback) => { focusCleanup?.(); focusCleanup = callback(); } },
    'expo-router/react-navigation': { usePreventRemove: (enabled, callback) => { removal = { enabled, callback }; } },
    './ExamNavigationContext': { useExamNavigation: () => ({ setActive: (value) => published.push(value) }) },
  });
  return {
    render(leave) { h.reset(); return runGuard(active, leave); },
    deactivate() { active = false; }, hardware: () => hardware(), unload: (event) => unload(event), removal: () => removal,
    cleanups, published,
    cleanup() { focusCleanup?.(); h.cleanup(); if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow; },
  };
}

test('hardware/removal guard preserves exam on save failure and serializes confirmation and modal dismissal', async () => {
  const h = guardHarness('android');
  try {
    let resolve, calls = 0;
    const leave = () => { calls++; return new Promise((r) => { resolve = r; }); };
    let vm = h.render(leave);
    assert.equal(h.hardware(), true); vm = h.render(leave); assert.equal(vm.dialog, 'blocked');
    assert.equal(h.removal().enabled, true); h.removal().callback();
    vm.requestLeave(); vm = h.render(leave); assert.equal(vm.dialog, 'leave');
    const pending = vm.confirm(); await vm.confirm(); vm.dismiss();
    assert.equal(calls, 1); assert.equal(h.render(leave).dialog, 'leave');
    resolve(false); await pending; vm = h.render(leave);
    assert.equal(vm.dialog, 'leave'); assert.match(vm.error, /could not be saved/); assert.equal(vm.leaving, false);
    const retry = vm.confirm(); assert.equal(calls, 2); resolve(true); await retry;
    assert.equal(h.render(leave).dialog, null);
  } finally { h.cleanup(); }
});

test('web unload/removal guards stay active after thrown save and clean up after completion', async () => {
  const h = guardHarness('web');
  try {
    const fail = async () => { throw Error('private detail'); }; let vm = h.render(fail);
    const event = { prevented: false, preventDefault() { this.prevented = true; } }; h.unload(event);
    assert.equal(event.prevented, true); assert.equal(event.returnValue, '');
    vm.requestLeave(); vm = h.render(fail); await vm.confirm(); vm = h.render(fail);
    assert.equal(vm.dialog, 'leave'); assert.ok(!vm.error.includes('private detail')); assert.equal(h.removal().enabled, true);
    const success = async () => true; vm = h.render(success); await vm.confirm(); assert.equal(h.render(success).dialog, null);
    h.deactivate(); h.render(success); assert.equal(h.removal().enabled, false); assert.ok(h.cleanups.includes('unload'));
  } finally { h.cleanup(); }
});

test('exam dialog fits safe areas, scrolls and blocks Android modal Back while saving', () => {
  let dismissed = 0;
  const { ExamExitDialog } = loadComponent('../ExamExitDialog.tsx', {
    '@/hooks/use-theme': { useThemeScheme: () => 'light' },
    'react-native': { Modal: 'Modal', ScrollView: 'Scroll', View: 'View', StyleSheet: { create: (s) => s } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 24, bottom: 20, left: 30, right: 10 }) },
    '@/components/FeedbackNotice': { FeedbackNotice: 'Feedback' }, '@/components/themed-text': { ThemedText: 'Text' },
    '@/features/auth/components/AuthFields': { AuthButton: 'Button' }, '@/constants/theme': { Colors: { light: {}, dark: {} }, Spacing: { three: 16, four: 24 } },
  });
  const props = { mode: 'leave', busy: true, error: 'Save failed', onDismiss: () => dismissed++, onConfirm: () => {} };
  const tree = ExamExitDialog(props); tree.props.onRequestClose(); assert.equal(dismissed, 0);
  assert.deepEqual(tree.props.children.props.style[1], { paddingTop: 40, paddingBottom: 36, paddingLeft: 46, paddingRight: 26 });
  assert.ok(nodes(tree).some((n) => n.type === 'Scroll'));
  assert.ok(nodes(tree).find((n) => n.type === 'Feedback').props.message === 'Save failed');
  assert.ok(nodes(tree).filter((n) => n.type === 'Button').every((n) => n.props.disabled));
  ExamExitDialog({ ...props, busy: false }).props.onRequestClose(); assert.equal(dismissed, 1);
});

test('real tab layout keeps legacy results hidden and protected, and blocks tab presses during exams', () => {
  const React = require('react');
  const Tabs = Object.assign(() => null, { Screen: () => null, Protected: () => null });
  for (const user of [null, { role: 'MEMBER' }, { role: 'ADMIN' }, { role: 'STAFF', permissions: [] }]) {
    for (const active of [false, true]) {
      const { default: Layout } = loadComponent('../AuthenticatedTabs.tsx', {
        'expo-router/js-tabs': { Tabs }, 'expo-symbols': { SymbolView: () => null },
        'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 0 }) },
        '@/constants/theme': { Typography: { tab: {} } }, '@/hooks/use-theme': { useTheme: () => ({}) },
        '@/store': { useAuth: (selector) => selector({ user }) },
        '@/features/exam/PaperSourceContext': { PaperSourceProvider: () => null },
        './ExamNavigationContext': { ExamNavigationProvider: () => null, useExamNavigation: () => ({ active }) },
        './NavigationHeader': { NavigationHeader: () => null }, './navigation': result.exports,
      });
      const tree = Layout().props.children.props.children.type();
      const guards = React.Children.toArray(tree.props.children);
      const visible = guards.filter((guard) => guard.props.guard && guard.props.children.props.options.href !== null);
      assert.deepEqual(visible.map((guard) => guard.props.children.props.name), tabs(user));
      const legacy = guards.find((guard) => guard.props.children.props.name === 'results');
      assert.equal(legacy.props.guard, user?.role === 'MEMBER');
      assert.equal(legacy.props.children.props.options.href, null);
      let prevented = false;
      tree.props.screenListeners.tabPress({ preventDefault: () => { prevented = true; } });
      assert.equal(prevented, active);
      assert.equal(tree.props.backBehavior, 'history');
      if (active) assert.equal(tree.props.screenOptions.tabBarStyle.display, 'none');
    }
  }
});

test('legacy results replaces its URL with Progress; Progress uses real attempt history', () => {
  const Redirect = () => null, MemberExamScreen = () => null;
  const legacy = loadComponent('../../../app/(app)/results.tsx', { 'expo-router': { Redirect } }).default();
  assert.equal(legacy.type, Redirect);
  assert.equal(legacy.props.href, '/progress');
  const progress = loadComponent('../../../app/(app)/progress.tsx', {
    '@/features/navigation/MemberExamScreen': { MemberExamScreen },
  }).default();
  assert.equal(progress.type, MemberExamScreen);
  assert.equal(progress.props.section, 'history');
});
test('signed-out and Member cannot see management even with management permissions', () => {
  assert.deepEqual(tabs(null), []);
  const member = { role: 'MEMBER', permissions: ['EXAM_MANAGE', 'QUESTION_MANAGE', 'CONTENT_READ'] };
  assert.deepEqual(tabs(member), ['index', 'exams', 'progress', 'profile']);
  assert.deepEqual(tabs(member).map((name) => tabConfig[name].label), ['Home', 'Exams', 'Progress', 'Profile']);
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

test('results permission alone grants Staff no Member or management destinations', () => {
  const staff = { role: 'STAFF', permissions: ['RESULTS_VIEW_ALL'] };
  assert.deepEqual(tabs(staff), ['index', 'profile']);
  for (const section of ['books', 'chapters', 'import', 'question']) assert.equal(canManageSection(staff, section), false);
  const fullStaff = { role: 'STAFF', permissions: ['CONTENT_READ', 'CONTENT_MANAGE', 'QUESTION_MANAGE', 'EXAM_MANAGE', 'RESULTS_VIEW_ALL'] };
  assert.deepEqual(tabs(fullStaff), ['index', 'papers', 'management', 'profile']);
  for (const section of ['books', 'chapters', 'import', 'question']) assert.equal(canManageSection(fullStaff, section), true);
  for (const section of ['staff', 'results', '__proto__', 'constructor']) assert.equal(canManageSection(fullStaff, section), false);
});
