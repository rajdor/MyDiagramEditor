// Font and Size with mixed text: shapes whose fonts or sizes differ show Mixed, and choosing any font, the first one shown
// included, applies it; while a label is edited the list and box follow the selected words, Mixed when they differ.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = (name, cond, detail) => { if (!cond) fail(name + (detail === undefined ? '' : ' -> ' + JSON.stringify(detail))); };
await sleep(1200);
const ev = (fn, ...a) => pg.evaluate(fn, ...a);
const r = await ev(() => {
  const E = DiagramEditor, S = E.S; S.doc = E.newDoc(); S.pi = 0; E.clearCache(); const P = E.page();
  const a = E.makeVertex('rect', 40, 40); a.id = 'A'; a.value = 'a'; a.style.fontFamily = 'Georgia'; a.style.fontSize = '12';
  const c = E.makeVertex('rect', 240, 40); c.id = 'C'; c.value = 'c'; a.style.fontFamily = 'Georgia'; c.style.fontFamily = 'Verdana'; c.style.fontSize = '20';
  P.cells.push(a, c); E.mutate(() => { }); E.setSel(['A', 'C']);
  const fs = document.getElementById('fontSel'), fz = document.getElementById('fontNum');
  const shown = [fs.value, fs.selectedOptions[0].textContent, fz.value, fz.placeholder];
  fs.value = 'Georgia'; fs.dispatchEvent(new Event('change'));
  return { shown, after: [E.cellById('A').style.fontFamily, E.cellById('C').style.fontFamily] };
});
ok('shapes with different fonts and sizes show Mixed', JSON.stringify(r.shown) === JSON.stringify(['', 'Mixed', '', 'Mixed']), r.shown);
ok('choosing the font the first shape already has applies it to them all', JSON.stringify(r.after) === JSON.stringify(['Georgia', 'Georgia']), r.after);
const e = await ev(async () => {
  const E = DiagramEditor, S = E.S, c = E.cellById('C'); c.style.fontFamily = 'Verdana'; c.value = 'plain <font face="Georgia">serif</font> end'; E.mutate(() => { }); E.setSel(['C']); E.startEdit(c); await new Promise(r => setTimeout(r, 100));
  const ed = S.editing.ed, rg = document.createRange(); rg.selectNodeContents(ed); const s = getSelection(); s.removeAllRanges(); s.addRange(rg); await new Promise(r => setTimeout(r, 50));
  const all = document.getElementById('fontSel').value;
  const f = ed.querySelector('font'), r2 = document.createRange(); r2.selectNodeContents(f); s.removeAllRanges(); s.addRange(r2); await new Promise(r => setTimeout(r, 50));
  const one = document.getElementById('fontSel').value;
  rg.selectNodeContents(ed); s.removeAllRanges(); s.addRange(rg); await new Promise(r => setTimeout(r, 50));
  const fs = document.getElementById('fontSel'); fs.value = 'Verdana'; fs.dispatchEvent(new Event('change')); await new Promise(r => setTimeout(r, 50));
  const html = ed.innerHTML; E.finishEdit(); return { all, one, html };
});
ok('while editing, words in two fonts show Mixed', e.all === '', e);
ok('and words in one font show that font', e.one === 'Georgia', e);
ok('choosing the shape\'s own font for mixed words applies it to them', !/Georgia/.test(e.html), e.html);
ok('no page errors', !errors.length, errors);
if (!process.exitCode) console.log('Mixed font checks passed');
await b.close();
