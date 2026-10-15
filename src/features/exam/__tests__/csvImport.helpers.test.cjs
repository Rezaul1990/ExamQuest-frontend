/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Exercise pure TS helpers with the project's installed compiler; no new runner.
const source = fs.readFileSync(require('node:path').join(__dirname, '../csvImport.helpers.ts'), 'utf8');
const moduleResult = { exports: {} };
new Function('module', 'exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(moduleResult, moduleResult.exports);
const { buildImportErrorReport, serializeImportRows, importHeaders } = moduleResult.exports;
test('edited remaining rows serialize exact 13-column header and escape content losslessly', () => {
  const row = Object.fromEntries(importHeaders.map((header) => [header, header]));
  row.question = 'বাংলা, "প্রশ্ন"\nনতুন লাইন';
  const csv = serializeImportRows([row]);
  assert.equal(csv.split('\r\n')[0], importHeaders.join(','));
  assert.ok(csv.includes('"বাংলা, ""প্রশ্ন""\nনতুন লাইন"'));
});
test('error report retains original row IDs, file errors and Unicode BOM', () => {
  const report = buildImportErrorReport([{rowNumber: 27, data: {question:'বাংলা'},errors:['Invalid mapping']}], ['Broken header']);
  assert.ok(report.startsWith('\uFEFF'));assert.ok(report.includes('"27","invalid","Invalid mapping"'));assert.ok(report.includes('"file","invalid","Broken header"'));
});
test('export neutralizes formulas including leading whitespace and tabs', () => {
  for (const value of ['=1+1','+cmd','-2','@sum','  =1','\t=1','\r=2','\n@sum']) {
    const report=buildImportErrorReport([{rowNumber:2,data:{question:value},errors:['Error']}]);
    assert.ok(report.includes('"\''+value+'"'),JSON.stringify(value));
  }
});
