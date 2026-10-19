/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');

function load(relative, platform = 'web', extra = {}) {
  const module = { exports: {} };
  const native = { Platform: { select: (choices) => choices[platform] ?? choices.default }, StyleSheet: { create: (styles) => styles }, Text: 'Text', View: 'View', Pressable: 'Pressable', TextInput: 'TextInput' };
  const source = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('module', 'exports', 'require', source)(module, module.exports, (name) => {
    if (name in extra) return extra[name];
    if (name === '@/hooks/use-theme') return {useThemeScheme:()=> 'light'};
    if (name === 'react-native') return native;
    if (name.endsWith('.css')) return {};
    return require(name);
  });
  return module.exports;
}
const tokens = load('constants/theme.ts');
function contrast(a, b) {
  const luminance = (hex) => {
    const [r,g,b] = hex.slice(1).match(/../g).map((v) => parseInt(v,16)/255).map((v) => v <= 0.04045 ? v/12.92 : ((v+0.055)/1.055)**2.4);
    return 0.2126*r + 0.7152*g + 0.0722*b;
  };
  const x=luminance(a), y=luminance(b);
  return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
}

test('semantic palettes preserve legacy aliases and handle unknown/system scheme fallbacks', () => {
  assert.deepEqual(Object.keys(tokens.Colors.light).sort(), Object.keys(tokens.Colors.dark).sort());
  assert.equal(tokens.ExamQuestColors, tokens.Colors.light);
  for (const palette of Object.values(tokens.Colors)) {
    assert.equal(palette.text, palette.textPrimary);
    assert.equal(palette.backgroundElement, palette.surface);
    assert.equal(palette.backgroundSelected, palette.surfaceSelected);
  }
  for (const scheme of [null, undefined, 'unspecified', 'light', 'invalid']) assert.equal(tokens.resolveThemeScheme(scheme), 'light');
  assert.equal(tokens.resolveThemeScheme('dark'), 'dark');
  assert.equal(tokens.Colors.light.brandPrimary, '#146C5D');
  assert.equal(tokens.Colors.light.background, '#F6F8FA');
});

test('normal text, feedback and primary/danger actions retain 4.5:1 contrast in both palettes', () => {
  for (const [mode,p] of Object.entries(tokens.Colors)) {
    for (const fg of ['textPrimary','textSecondary','textMuted','brandPrimary']) for (const bg of ['background','surface','surfaceSoft','surfaceSelected']) {
      assert.ok(contrast(p[fg],p[bg])>=4.5, `${mode} ${fg}/${bg}: ${contrast(p[fg],p[bg])}`);
    }
    for (const status of ['success','warning','error','info']) assert.ok(contrast(p[status],p[status+'Soft'])>=4.5, mode+' '+status);
    for (const bg of ['brandPrimary','brandPressed']) assert.ok(contrast(p.onBrandPrimary,p[bg])>=4.5, mode+' '+bg);
    for (const bg of ['error','errorPressed']) assert.ok(contrast(p.onError,p[bg])>=4.5, mode+' '+bg);
  }
});

test('layout/type/radius/elevation values match across iOS Android and web, without shrinking controls', () => {
  for (const platform of ['ios','android','web']) {
    const current=load('constants/theme.ts',platform);
    for (const group of ['Colors','Typography','Spacing','Radius','Elevation','ControlSize']) assert.deepEqual(current[group],tokens[group]);
    assert.ok(current.ControlSize.touch>=44);
    assert.ok(current.ControlSize.input>=44);
    assert.ok(current.ControlSize.button>=44);
    for (const value of Object.values(current.Typography)) if (value.lineHeight) assert.ok(value.lineHeight>value.fontSize);
    for (const value of Object.values(current.Elevation)) assert.ok(value.elevation>=0 && value.shadowRadius>=0);
  }
});

function themed(relative, mode, extra = {}) {
  return load(relative,'web', { '@/components/ui/ActionSurface':{ActionSurface:'ActionSurface'}, '@/constants/theme':tokens, '@/hooks/use-theme': { useTheme:()=>tokens.Colors[mode], useThemeScheme:()=>mode }, ...extra });
}
test('shared text/view consume selected palette and preserve caller overrides and Bengali content', () => {
  for (const mode of ['light','dark']) {
    const { ThemedText } = themed('components/themed-text.tsx',mode);
    const text=ThemedText({type:'linkPrimary',children:'পরীক্ষা শুরু করুন'});
    assert.equal(text.props.style.find(style=>style?.color).color,tokens.Colors[mode].brandPrimary);
    assert.equal(text.props.children,'পরীক্ষা শুরু করুন');
    const override={color:'custom'};
    assert.equal(ThemedText({style:override}).props.style.at(-1),override);
    const { ThemedView }=themed('components/themed-view.tsx',mode);
    assert.equal(ThemedView({type:'surface'}).props.style[0].backgroundColor,tokens.Colors[mode].surface);
    assert.equal(ThemedView({lightColor:'day',darkColor:'night'}).props.style[0].backgroundColor,mode==='dark'?'night':'day');
  }
});

test('shared action states use semantic normal/pressed/danger/disabled colors in both schemes', () => {
  for (const mode of ['light','dark']) {
    const p=tokens.Colors[mode];
    const { AuthButton }=themed('features/auth/components/AuthFields.tsx',mode,{
      '@/components/themed-text':{ThemedText:'ThemedText'},
      '@/features/auth/Auth.styles':{useAuthStyles:()=>({})},
    });
    for (const [variant,normal,pressed,foreground] of [['primary',p.brandPrimary,p.brandPressed,p.onBrandPrimary],['secondary',p.surface,p.surfaceSelected,p.textPrimary],['danger',p.error,p.errorPressed,p.onError]]) {
      const button=AuthButton({label:'চালিয়ে যান',onPress:()=>{},variant,disabled:true});
      assert.equal(button.props.style({pressed:false}).findLast(style=>style?.backgroundColor).backgroundColor,normal);
      assert.equal(button.props.style({pressed:true}).findLast(style=>style?.backgroundColor).backgroundColor,pressed);
      assert.equal(button.props.children.props.style.at(-1).color,foreground);
      assert.equal(button.props.disabled,true);
    }
  }
});

test('input focus styling retains caller callbacks and error priority in both schemes', () => {
  for (const mode of ['light','dark']) for (const errorText of [null,'ভুল তথ্য']) {
    let stateIndex=0;
    const updates=[];
    const calls=[];
    const {AuthTextField}=themed('features/auth/components/AuthFields.tsx',mode,{
      '@/components/themed-text':{ThemedText:'ThemedText'},
      '@/features/auth/Auth.styles':{useAuthStyles:()=>({})},
      react:{useState:()=>[stateIndex++===1,(value)=>updates.push(value)]},
    });
    const field=AuthTextField({label:'নাম',placeholder:'নাম',value:'',onChangeText:()=>{},errorText,onFocus:(event)=>calls.push(event),onBlur:(event)=>calls.push(event)});
    const shell=field.props.children[1];
    const input=shell.props.children[0];
    const palette=tokens.Colors[mode];
    assert.equal(shell.props.style.at(-1).borderColor,errorText?palette.error:palette.focusRing);
    assert.equal(input.props.placeholderTextColor,palette.textMuted);
    assert.equal(input.props.allowFontScaling,true);
    assert.equal(input.props.maxFontSizeMultiplier,0);
    input.props.onFocus('focus');input.props.onBlur('blur');
    assert.deepEqual(updates,[true,false]);
    assert.deepEqual(calls,['focus','blur']);
  }
});

test('Bangla reading roles preserve unlimited scalable text and native font padding', () => {
  for (const platform of ['ios','android','web']) {
    const platformTokens=load('constants/theme.ts',platform);
    const {ThemedText}=load('components/themed-text.tsx',platform,{
      '@/constants/theme':platformTokens,
      '@/hooks/use-theme':{useTheme:()=>platformTokens.Colors.light},
    });
    for (const type of ['question','option','explanation']) {
      const text=ThemedText({type,children:'শ্রদ্ধা, দৃষ্টিভঙ্গি, ক্ষুদ্র ঋণ — HSC ২০২৬ (x² + y²)'});
      assert.equal(text.props.allowFontScaling,true);
      assert.equal(text.props.maxFontSizeMultiplier,0);
      assert.equal(text.props.adjustsFontSizeToFit,false);
      assert.equal(text.props.numberOfLines,undefined);
      assert.equal(text.props.style[0].flexShrink,1);
      assert.equal(text.props.style[0].minWidth,0);
      if (platform==='android') assert.equal(text.props.style[0].includeFontPadding,true);
      const role=platformTokens.Typography[type];
      assert.ok(role.lineHeight/role.fontSize>=1.6);
    }
    assert.equal(ThemedText({allowFontScaling:false,maxFontSizeMultiplier:1.3}).props.allowFontScaling,false);
    assert.equal(ThemedText({maxFontSizeMultiplier:1.3}).props.maxFontSizeMultiplier,1.3);
  }
});

test('long mixed Bangla exam question/options remain complete and preserve canonical selection', () => {
  const questionText=('ক্ষুদ্র ঋণ ও দৃষ্টিভঙ্গির পরিবর্তন সম্পর্কে নিচের অনুচ্ছেদটি পড়ুন। SSC/HSC ২০২৬: x² + y² = ২৫।\n').repeat(8);
  const optionText='যুক্তাক্ষরসহবাংলাশব্দ'.repeat(15)+' — দীর্ঘ উত্তর, ১২৩ এবং English';
  const selected=[];
  const {ActiveExamPanel}=load('features/exam/components/ActiveExamPanel.tsx','android',{
    react:{useState:(initial)=>[initial,()=>{}]},
    '@/components/themed-text':{ThemedText:'ThemedText'},
    '@/features/auth/components/AuthFields':{AuthButton:'AuthButton'},
    '@/features/auth/Auth.styles':{useAuthStyles:()=>({})},
    '../memberExam.helpers':{countdownLabel:()=> '20:00'},
    './QuestionReportButton':{QuestionReportButton:'Report'},
    './learning.styles':{useLearningStyles:()=>({chip:'chip',answerOption:'answerOption'})},
  });
  const tree=ActiveExamPanel({attempt:{id:'attempt',questions:[{id:'q1',text:questionText,options:[{key:'C',label:'A',text:optionText}]}]},paper:{title:'বাংলা পরীক্ষা'},answers:{},reviewIds:[],secondsLeft:1200,select:(...args)=>selected.push(args)});
  const elements=[];
  function visit(node){if(!node||typeof node!=='object')return;if(Array.isArray(node)){node.forEach(visit);return;}elements.push(node);visit(node.props?.children);}
  visit(tree);
  const question=elements.find(node=>node.type==='ThemedText'&&node.props.type==='question');
  assert.equal(question.props.children,questionText);
  assert.equal(question.props.numberOfLines,undefined);
  const radio=elements.find(node=>node.props?.accessibilityRole==='radio');
  assert.ok(radio.props.style.includes('answerOption'));
  assert.equal(radio.props.children.props.type,'option');
  assert.ok(radio.props.children.props.children.includes(optionText));
  radio.props.onPress();
  assert.deepEqual(selected,[['q1','C']], 'display A must still select canonical C');
});

test('scaled inputs/buttons and text-bearing badges can grow within small screens', () => {
  const {authStyles:s}=load('features/auth/Auth.styles.ts','android',{'@/constants/theme':tokens});
  assert.equal(s.input.minWidth,0, 'do not retain the browser input intrinsic width');
  assert.equal(s.input.height,undefined);
  assert.equal(s.button.height,undefined);
  assert.ok(s.button.paddingVertical>0);
  for (const key of ['previewAvatar','previewCheck','stepNumber','checkbox','dashboardStepMarker']) {
    assert.equal(s[key].height,undefined,key);
    assert.ok(s[key].minHeight>0,key);
  }
});
