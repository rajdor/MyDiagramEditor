// Runs every test/t*.mjs in order from the repository root and reports failures. Output goes to test/out/results.txt.
// A test fails if it exits non-zero, prints a page error, or (when test/baseline/<name>.txt exists) its output differs
// from that approved baseline. Generated ids are masked before comparing.
//   node test/run-all.mjs                 run everything
//   node test/run-all.mjs t3 t33          run only these
//   node test/run-all.mjs --update        re-approve the baselines from this run (review the git diff afterwards)
import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { ROOT } from './harness.mjs';

const args = process.argv.slice(2), update = args.includes('--update'), only = args.filter(a => !a.startsWith('--')).map(a => a.replace(/\.mjs$/, '') + '.mjs');
const BASE = path.join(ROOT, 'test', 'baseline');
const normalise = (s) => s.replace(/\r\n/g, '\n').split('\n')
  .filter(l => !/^\[agent-proxy\]|connect_rejected|^Allowed domains|^For details|^- [a-z0-9.-]+:443/.test(l)) // sandbox proxy noise
  .map(l => l.replace(/\bc[a-z0-9]{11,16}\b/g, '<id>').trimEnd()).filter(l => l !== '').join('\n') + '\n';
const tests = fs.readdirSync(path.join(ROOT, 'test')).filter(f => /^t\d+\.mjs$/.test(f) && (!only.length || only.includes(f)))
  .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
let failed = 0, log = '';
const t0 = Date.now();
for (const t of tests) {
  const r = spawnSync(process.execPath, [path.join('test', t)], { cwd: ROOT, encoding: 'utf8', timeout: 600000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const bf = path.join(BASE, t.replace('.mjs', '.txt'));
  let why = r.status !== 0 ? 'exit code ' + r.status : /PAGEERROR/.test(out) ? 'page error' : '';
  if (!why && fs.existsSync(bf)) {
    if (update) fs.writeFileSync(bf, normalise(out));
    else if (normalise(out) !== fs.readFileSync(bf, 'utf8').replace(/\r\n/g, '\n')) {
      const a = fs.readFileSync(bf, 'utf8').replace(/\r\n/g, '\n').split('\n'), b = normalise(out).split('\n');
      const i = a.findIndex((l, k) => l !== b[k]);
      why = 'output differs from test/baseline at line ' + (i + 1) + ':\n  expected: ' + a[i] + '\n  actual:   ' + b[i];
    }
  }
  if (why) failed++;
  console.log((why ? 'FAIL ' : 'ok   ') + t + (why ? '  (' + why.split('\n')[0] + ')' : ''));
  log += '===== ' + t + (why ? ' FAIL: ' + why : ' ok') + '\n' + out + '\n';
}
fs.writeFileSync(path.join(ROOT, 'test', 'out', 'results.txt'), log);
console.log(tests.length - failed + '/' + tests.length + ' passed in ' + Math.round((Date.now() - t0) / 1000) + ' s; details in test/out/results.txt' + (update ? ' (baselines updated)' : ''));
process.exit(failed ? 1 : 0);
