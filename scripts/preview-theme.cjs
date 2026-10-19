// Development-only static specimens using the real RN Web primitives and source components.
// No product route, account, metrics, API request or dependency installation.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const native = require('react-native-web');
const root = path.resolve(__dirname, '../src');
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file,module);
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'), { compilerOptions: { module:ts.ModuleKind.CommonJS, jsx:ts.JsxEmit.ReactJSX } }).outputText;
  new Function('module','exports','require',code)(module,module.exports,(name)=>{
    if (name.endsWith('.css')) return {};
    if (name === 'react-native') return native;
    if (name.startsWith('@/')) {
      const base=path.join(root,name.slice(2));
      const target=['.web.ts','.web.tsx','.ts','.tsx'].map(ext=>base+ext).find(p=>fs.existsSync(p));
      if (!target) throw Error('Missing preview source: '+name);
      return load(target);
    }
    return require(name);
  });
  return module.exports;
}
const tokens=load(path.join(root,'constants/theme.ts'));
const typography=process.argv.includes('--typography');
const scale=Number(process.argv.find(arg=>arg.startsWith('--scale='))?.split('=')[1]||1);
if (!Number.isFinite(scale)||scale<1||scale>3) throw Error('Preview scale must be between 1 and 3');
// Preview-only web approximation; Android system font scaling still needs native verification.
for (const [role,style] of Object.entries(tokens.Typography)) tokens.Typography[role]={...style,fontSize:style.fontSize*scale,...(style.lineHeight?{lineHeight:style.lineHeight*scale}:{})};
const {ThemeScope}=load(path.join(root,'hooks/use-theme.ts'));
const {ThemedText}=load(path.join(root,'components/themed-text.tsx'));
const {ThemedView}=load(path.join(root,'components/themed-view.tsx'));
const {AuthButton,AuthTextField}=load(path.join(root,'features/auth/components/AuthFields.tsx'));
const e=React.createElement;
function specimens() {
  return e(native.View,{style:{flexDirection:'row',flexWrap:'wrap',gap:tokens.Spacing.four,padding:tokens.Spacing.four}},
    ...['light','dark'].map(mode=>e(ThemeScope,{key:mode,value:mode},e(ThemedView,{type:'background',style:{width:'100%',maxWidth:360,padding:tokens.Spacing.three,gap:tokens.Spacing.three,borderRadius:tokens.Radius.lg}},
      e(ThemedText,{type:'sectionTitle'},mode==='light'?'Light · আলো':'Dark · অন্ধকার'),
      typography&&e(ThemedView,{type:'surface',style:{padding:tokens.Spacing.three,gap:tokens.Spacing.three,borderRadius:tokens.Radius.md}},
        e(ThemedText,{type:'caption'},'Long-text wrapping · SSC/HSC ২০২৬ · preview only'),
        e(ThemedText,{type:'question',testID:'reading-question'},'শ্রদ্ধা, দৃষ্টিভঙ্গি ও ক্ষুদ্র ঋণের প্রভাবে সমাজে কী পরিবর্তন আসে? নিচের অনুচ্ছেদটি পড়ে যুক্তিসহ উত্তর নির্বাচন করুন।\nসমীকরণ: x² + y² = ২৫; ১২৩ / 2026 — বাংলা ও English একসঙ্গে।'),
        e(ThemedView,{type:'surfaceSelected',style:{padding:tokens.Spacing.twoHalf,borderRadius:tokens.Radius.sm}},e(ThemedText,{type:'option',testID:'reading-option'},'ক. '+'যুক্তাক্ষরসহবাংলাশব্দ'.repeat(8)+' — দীর্ঘ উত্তর, সংখ্যা ১২৩ এবং English.')),
        e(ThemedText,{type:'explanation',testID:'reading-explanation'},'ব্যাখ্যা: প্রশ্নের তথ্য অনুযায়ী দৃষ্টিভঙ্গির পরিবর্তন ও অর্থনৈতিক কর্মকাণ্ডের সম্পর্ক বিচার করতে হবে।\nদ্বিতীয় অনুচ্ছেদ: ক্ষুদ্র উদ্যোগের মাধ্যমে শিক্ষা ও কর্মসংস্থানের সুযোগ বাড়ে।'),
        e(AuthButton,{label:'দীর্ঘ নির্দেশনা পড়ে পরবর্তী প্রশ্নে ফিরে যান',onPress:()=>{},variant:'secondary'})
      ),
      e(ThemedView,{type:'surface',style:{padding:tokens.Spacing.three,gap:tokens.Spacing.two,borderRadius:tokens.Radius.md,...tokens.Elevation.card}},
        e(ThemedText,{type:'sectionTitle'},'আপনার শেখার পরবর্তী ধাপ'),
        e(ThemedText,{type:'small',themeColor:'textSecondary'},'Static component specimen · no account or exam data'),
        e(AuthTextField,{label:'ইমেইল',placeholder:'student@example.test',value:'',onChangeText:()=>{},editable:false}),
        e(AuthTextField,{label:'Validation state',placeholder:'Required',value:'',onChangeText:()=>{},editable:false,errorText:'এই ঘরটি পূরণ করুন'}),
        ...['primary','secondary','danger'].map(variant=>e(AuthButton,{key:variant,label:variant,onPress:()=>{},variant})),
        e(AuthButton,{label:'Disabled',onPress:()=>{},disabled:true}),
        ...['success','warning','error','info'].map(status=>e(ThemedView,{key:status,type:status+'Soft',style:{padding:tokens.Spacing.two,borderRadius:tokens.Radius.sm}},e(ThemedText,{type:'small',themeColor:status},status+' · বাংলা পাঠ')))
      )
    ))));
}
native.AppRegistry.registerComponent('Tokens',()=>specimens);
const {element,getStyleElement}=native.AppRegistry.getApplication('Tokens',{});
const body=renderToStaticMarkup(element);
const title=typography?'EQ-005 Bangla readability specimens':'EQ-004 static theme specimens';
const html='<!doctype html><html lang="bn"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><style>'+fs.readFileSync(path.join(root,'global.css'),'utf8')+'</style>'+renderToStaticMarkup(getStyleElement())+`<body style="margin:0;background:${tokens.Colors.light.surfaceSoft}"><p style="padding:0 ${tokens.Spacing.four}px;font:${tokens.Typography.small.fontSize}px system-ui">${title} · ${scale}x web approximation; controls are noninteractive. No exam/account data.</p>`+body+'</body></html>';
const output=fs.mkdtempSync(path.join(os.tmpdir(),'examquest-theme-'));
fs.writeFileSync(path.join(output,'index.html'),html);
console.log('Static specimens: '+path.join(output,'index.html'));
if (process.argv.includes('--serve')) {
  require('node:http').createServer((_req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html);}).listen(8084,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:8084'));
}
