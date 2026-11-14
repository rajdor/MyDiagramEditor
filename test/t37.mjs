// Static checks (ESLint) on the built app script: undefined names, duplicate keys, unreachable code, unused code,
// suspicious comparisons. Runs on diagram-editor.html, so it checks exactly what ships.
import { ESLint } from 'eslint';
import globals from 'globals';
import fs from 'fs';
import path from 'path';
import { ROOT } from './harness.mjs';
const html = fs.readFileSync(path.join(ROOT, 'diagram-editor.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const app = scripts[scripts.length - 1];
const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: [{
  languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.browser, rough: 'readonly' } },
  rules: { 'no-undef': 'error', 'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^stencilXml$' }] /* stencilXml is used by the tests through shapes.js */, 'no-dupe-keys': 'error', 'no-unreachable': 'error',
    'no-self-assign': 'error', 'no-self-compare': 'error', 'no-cond-assign': ['error', 'except-parens'], 'no-dupe-else-if': 'error', 'no-duplicate-case': 'error',
    'use-isnan': 'error', 'valid-typeof': 'error', 'no-unsafe-negation': 'error', 'no-unsafe-optional-chaining': 'error', 'no-loss-of-precision': 'error',
    'no-redeclare': ['error', { builtinGlobals: false }], 'no-func-assign': 'error', 'no-sparse-arrays': 'error', 'eqeqeq': ['error', 'smart'],
    'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }], 'no-implied-eval': 'error', 'no-eval': 'error', 'no-new-func': 'error', 'no-script-url': 'error' } }] });
const [res] = await eslint.lintText(app, { filePath: 'diagram-editor.js' });
const lines = app.split('\n');
for (const m of res.messages) console.log('FAIL: line ' + m.line + ': ' + m.message + (m.ruleId ? ' (' + m.ruleId + ')' : '') + '\n    ' + (lines[m.line - 1] || '').trim().slice(0, 140));
if (res.messages.length) process.exitCode = 1;
console.log(res.messages.length ? 'Static checks FAILED (' + res.messages.length + ' problems)' : 'Static checks passed (' + lines.length + ' lines)');
