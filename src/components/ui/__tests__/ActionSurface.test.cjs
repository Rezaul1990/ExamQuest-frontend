/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root=path.resolve(__dirname,'../../..');
function compile(relative,extra={}) {
  const module={exports:{}};
  const code=ts.transpileModule(fs.readFileSync(path.join(root,relative),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  new Function('module','exports','require',code)(module,module.exports,(name)=>name in extra?extra[name]:require(name));
  return module.exports;
}
const native={Pressable:'Pressable',View:'View',Platform:{select:values=>values.web??values.default},StyleSheet:{create:styles=>styles}};
function surface({focused=false,mode='light',updates=[]}={}) {
  return compile('components/ui/ActionSurface.tsx',{
    react:{useState:()=>[focused,value=>updates.push(value)]},
    'react-native':native,
    '@/constants/theme':{ControlSize:{touch:44}},
    '@/hooks/use-theme':{useTheme:()=>({focusRing:mode==='dark'?'dark-focus':'light-focus'})},
  }).ActionSurface;
}
function flatten(style) {return Object.assign({},...style.flat(Infinity).filter(Boolean));}

test('disabled/busy surfaces never dispatch while active surfaces forward event and role/state',()=>{
  const ActionSurface=surface();
  const event={nativeEvent:{}};
  const calls=[];
  for (const props of [{disabled:true},{busy:true},{disabled:true,busy:true}]) {
    const button=ActionSurface({...props,onPress:event=>calls.push(event),children:'Submit',accessibilityState:{selected:true}});
    button.props.onPress(event);
    assert.equal(button.props.disabled,true);
    assert.equal(button.props.accessibilityState.disabled,true);
    assert.equal(button.props.accessibilityState.selected,true);
    assert.equal(button.props.accessibilityState.busy,!!props.busy);
    assert.equal(button.props['aria-disabled'],true);
    assert.equal(button.props['aria-busy'],!!props.busy);
    assert.equal(button.props['aria-selected'],true);
  }
  assert.deepEqual(calls,[]);
  const active=ActionSurface({onPress:event=>calls.push(event),accessibilityRole:'radio',accessibilityState:{checked:true},children:'Answer'});
  active.props.onPress(event);
  assert.deepEqual(calls,[event]);
  assert.equal(active.props.accessibilityRole,'radio');
  assert.equal(active.props.accessibilityState.checked,true);
  assert.equal(active.props['aria-checked'],true);
  assert.equal(active.props.children,'Answer');
  for (const flags of [{'aria-disabled':true},{accessibilityState:{disabled:true}}]) {
    const blocked=ActionSurface({...flags,onPress:()=>calls.push('unexpected')});
    blocked.props.onPress(event);
    assert.equal(blocked.props.disabled,true);
  }
  assert.deepEqual(calls,[event]);
});

test('web aliases retain disclosure values and explicit ARIA overrides',()=>{
  const ActionSurface=surface();
  const expanded=ActionSurface({accessibilityState:{expanded:true}});
  assert.equal(expanded.props['aria-expanded'],true);
  const override=ActionSurface({'aria-expanded':false,accessibilityState:{expanded:true}});
  assert.equal(override.props['aria-expanded'],false);
});

test('focus callbacks, semantic outline and minimum targets survive custom/pressed styles',()=>{
  for (const mode of ['light','dark']) {
    const updates=[],calls=[];
    const ActionSurface=surface({focused:true,mode,updates});
    const button=ActionSurface({onFocus:event=>calls.push(event),onBlur:event=>calls.push(event),style:({pressed})=>[{backgroundColor:pressed?'pressed':'normal'}]});
    const style=flatten(button.props.style({pressed:true}));
    assert.equal(style.minWidth,44);assert.equal(style.minHeight,44);
    assert.equal(style.outlineColor,mode+'-focus');assert.equal(style.outlineWidth,2);
    assert.equal(style.backgroundColor,'pressed');
    button.props.onFocus('focus');button.props.onBlur('blur');
    assert.deepEqual(updates,[true,false]);assert.deepEqual(calls,['focus','blur']);
    const blocked=ActionSurface({busy:true,style:{padding:12}});
    const disabledStyle=flatten(blocked.props.style({pressed:true}));
    assert.equal(disabledStyle.opacity,0.6);assert.equal(disabledStyle.outlineWidth,undefined);
  }
});

test('dashboard card delegates the real callback/content and disabled state to the same surface',()=>{
  const calls=[];
  const {DashboardActionCard}=compile('components/DashboardActionCard.tsx',{
    'react-native':native,'@/components/ui/ActionSurface':{ActionSurface:'ActionSurface'},
    '@/components/themed-text':{ThemedText:'ThemedText'},'@/features/auth/Auth.styles':{useAuthStyles:()=>({})},
  });
  const card=DashboardActionCard({title:'প্রশ্ন ব্যাংক',meta:'Assigned books',disabled:true,onPress:()=>calls.push('open')});
  assert.equal(card.type,'ActionSurface');assert.equal(card.props.disabled,true);
  const ActionSurface=surface();
  ActionSurface(card.props).props.onPress({});assert.deepEqual(calls,[]);
  ActionSurface({...card.props,disabled:false}).props.onPress({});assert.deepEqual(calls,['open']);
});

test('collapsible retains disclosure state, title, animation and mounted content through the surface',()=>{
  const set=[];
  for (const open of [false,true]) {
    const {Collapsible}=compile('components/ui/collapsible.tsx',{
      react:{useState:()=>[open,value=>set.push(typeof value==='function'?value(open):value)]},
      'react-native':native,'expo-symbols':{SymbolView:'Symbol'},
      'react-native-reanimated':{default:{View:'AnimatedView'},FadeIn:{duration:()=> 'animation'}},
      '@/components/ui/ActionSurface':{ActionSurface:'ActionSurface'},
      '@/components/themed-text':{ThemedText:'ThemedText'},'@/components/themed-view':{ThemedView:'ThemedView'},
      '@/constants/theme':{Spacing:{two:8,three:16,four:24}},'@/hooks/use-theme':{useTheme:()=>({text:'text'})},
    });
    const tree=Collapsible({title:'আরও তথ্য',children:'Own content'});
    const trigger=tree.props.children[0];
    assert.equal(trigger.type,'ActionSurface');
    assert.equal(trigger.props.accessibilityLabel,'আরও তথ্য');
    assert.equal(trigger.props.accessibilityState.expanded,open);
    trigger.props.onPress();
    assert.equal(!!tree.props.children[1],open);
    if (open) assert.equal(tree.props.children[1].props.children.props.children,'Own content');
  }
  assert.deepEqual(set,[true,false]);
});
