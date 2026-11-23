// Labels: line spacing stays 1.2 of each piece of text's own size, also for text pasted with a fixed line height, so larger
// words never overlap and the canvas matches the exported picture; text pasted into a label takes the label's font, size
// and colour, keeping bold, italic, underline and line breaks.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = (name, cond, detail) => { if (!cond) fail(name + (detail === undefined ? '' : ' -> ' + JSON.stringify(detail))); };
await sleep(1200);
const ev = (fn, ...a) => pg.evaluate(fn, ...a);
const r = await ev(async () => {
  const E = DiagramEditor, S = E.S; S.doc = E.newDoc(); S.pi = 0; E.clearCache();
  const c = E.makeVertex('rect', 40, 40); c.id = 'P'; c.w = 160; c.h = 200; c.style.whiteSpace = 'wrap'; c.style.fontSize = '12';
  c.value = '<span style="font-family: Arial; font-size: 14px; line-height: 18px;">one two <span style="font-size: 24px">three four five six seven</span> eight nine ten</span>';
  E.page().cells.push(c); E.mutate(() => { }); await new Promise(r => setTimeout(r, 200));
  const big = document.querySelector('[data-label="P"] .lbl span span');
  return { lh: getComputedStyle(big).lineHeight, fs: getComputedStyle(big).fontSize, kept: /line-height/.test(E.labelHtml(c)) };
});
ok('a fixed line height in a label is not used: larger words get 1.2 of their own size', r.lh === '28.8px' && !r.kept, r);
const al = await ev(async () => {
  const E = DiagramEditor, S = E.S; S.doc = E.newDoc(); S.pi = 0; E.clearCache();
  const vals = { divstyle: '<div style="text-align: left;">one two</div>', attr: '<div align="left">one two</div>', block: '<span style="text-align:left;display:block">one</span>' };
  let y = 20; for (const k in vals) { const c = E.makeVertex('rect', 20, y); c.id = k; c.w = 200; c.h = 60; c.value = vals[k]; c.style.align = 'right'; E.page().cells.push(c); y += 80; }
  E.mutate(() => { }); await new Promise(r => setTimeout(r, 200));
  return Object.keys(vals).map(k => { const l = document.querySelector('[data-label="' + k + '"] .lbl'), tn = document.createTreeWalker(l, NodeFilter.SHOW_TEXT).nextNode(), t = document.createRange(); t.selectNodeContents(tn); return Math.round(l.getBoundingClientRect().right - t.getBoundingClientRect().right); });
});
ok('alignment carried in a label\'s text does not override the shape\'s: right means right', al.every(g => g <= 1), al);
// paste into a label being edited
const p = await ev(async () => {
  const E = DiagramEditor, S = E.S; S.doc = E.newDoc(); S.pi = 0; E.clearCache();
  const c = E.makeVertex('rect', 40, 40); c.id = 'Q'; c.w = 200; c.h = 120; c.value = ''; c.style.fontFamily = 'Georgia'; c.style.fontSize = '16'; c.style.fontColor = '#14532d';
  E.page().cells.push(c); E.mutate(() => { }); E.setSel(['Q']); E.startEdit(c); await new Promise(r => setTimeout(r, 100));
  const ed = S.editing.ed, d = new DataTransfer();
  d.setData('text/html', '<html><body><!--StartFragment--><h2 style="font-size:28px">Heading</h2><p style="text-align: left; font-family: Calibri; font-size: 11pt; color: #ff0000; line-height: 14px; margin: 0">plain <strong style="font-family: Calibri">bold</strong> <em>it</em> <span style="color:#0000ff;font-size:30px">blue</span></p><!--EndFragment--></body></html>');
  d.setData('text/plain', 'Heading\nplain bold it blue');
  ed.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: d }));
  const html = ed.innerHTML; E.finishEdit(); await new Promise(r => setTimeout(r, 100));
  return { html, value: E.cellById('Q').value };
});
ok('pasted text has no font, size, colour or line height of its own', !/text-align|font-family|font-size|color|line-height|Calibri|11pt|#ff0000|#0000ff/i.test(p.html), p.html);
ok('bold, italic and the text stay; a pasted heading becomes a bold line', /<strong>bold<\/strong>|<b>bold<\/b>/.test(p.html) && /<em>it<\/em>|<i>it<\/i>/.test(p.html) && /<b>Heading<\/b>/.test(p.html) && /blue/.test(p.value), p.html);
ok('no heading or paragraph tags are left to change the size or spacing', !/<h\d|<p[ >]/i.test(p.value), p.value);
ok('no page errors', !errors.length, errors);
if (!process.exitCode) console.log('Label spacing and paste checks passed');
await b.close();
