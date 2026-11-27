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
// a table in a label (a draw.io entity) keeps its own column alignment and layout attributes; bad values are dropped
const tb = await ev(async () => {
  const E = DiagramEditor, S = E.S; S.doc = E.newDoc(); S.pi = 0; E.clearCache();
  const c = E.makeVertex('rect', 20, 20); c.id = 'T'; c.w = 300; c.h = 90; c.style.html = '1'; c.style.align = 'center'; c.style.verticalAlign = 'top';
  c.value = '<table style="width:100%" cellpadding="2" cellspacing="0" border="0" align="right"><tr><td colspan="3" align="center" bgcolor="#1E3A5F" style="color:#ffffff">ENTITY</td></tr>' +
    '<tr><td width="40" valign="top">PK</td><td style="text-align:left">registration_id</td><td align="right" id="x" onclick="x()" colspan="9999" bgcolor="url(x)">uuid</td></tr></table>';
  E.page().cells.push(c); E.mutate(() => { }); await new Promise(r => setTimeout(r, 200));
  const l = document.querySelector('[data-label="T"] .lbl'), tds = [...l.querySelectorAll('td')], box = l.getBoundingClientRect(), html = E.labelHtml(c);
  const textRight = (td) => { const t = document.createRange(); t.selectNodeContents(td.firstChild); return t.getBoundingClientRect(); };
  return { html, headSpan: tds[0].colSpan, uuidGap: Math.round(tds[3].getBoundingClientRect().right - textRight(tds[3]).right), nameGap: Math.round(textRight(tds[2]).left - tds[2].getBoundingClientRect().left), pkLeft: Math.round(tds[1].getBoundingClientRect().left - box.left) };
});
ok('a table in a label keeps its column alignment: the type sits at the right of its cell, the name at the left', tb.uuidGap <= 4 && tb.nameGap <= 4 && tb.pkLeft <= 4, tb);
ok('a table keeps colspan, width, valign, bgcolor, cellpadding and cellspacing', tb.headSpan === 3 && /colspan="3"/.test(tb.html) && /width="40"/.test(tb.html) && /valign="top"/.test(tb.html) && /bgcolor="#1E3A5F"/.test(tb.html) && /cellpadding="2"/.test(tb.html) && /cellspacing="0"/.test(tb.html), tb.html);
// the exported picture (what a host page such as the document editor shows) sets the table out the same way, with no HTML
const ex = await ev(() => {
  const E = DiagramEditor, svg = E.buildExportSvg(E.page(), { fonts: false }).svg, d = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const texts = [...d.querySelectorAll('text')].map(t => ({ s: t.textContent, x: +t.getAttribute('x'), y: +t.getAttribute('y') })), fills = [...d.querySelectorAll('rect')].map(r => r.getAttribute('fill'));
  return { texts, fills, html: /foreignObject|<td|<table/.test(svg) };
});
const tx = (w) => ex.texts.find(t => t.s === w) || {};
ok('the exported picture keeps a table label\'s columns: each cell its own text, on one row, the type right of the name', !ex.html && tx('PK').y === tx('registration_id').y && tx('PK').x < tx('registration_id').x && tx('registration_id').x < tx('uuid').x && tx('uuid').x > 200 && tx('ENTITY').x > 100, ex.texts);
ok('the exported picture keeps a table cell\'s fill', ex.fills.includes('rgb(30, 58, 95)'), ex.fills);
const nb = await ev(() => { const E = DiagramEditor, S = E.S; S.doc = E.newDoc(); S.pi = 0; E.clearCache();
  const c = E.makeVertex('rect', 20, 20); c.style.html = '1'; c.style.fontStyle = '1'; c.value = 'Title<br><font style="font-size:11px;font-weight:normal">sub</font>'; E.page().cells.push(c);
  const d = new DOMParser().parseFromString(E.buildExportSvg(E.page(), { fonts: false }).svg, 'image/svg+xml'); return [...d.querySelectorAll('tspan')].map(t => [t.textContent, t.getAttribute('font-weight')]); });
ok('the exported picture: normal weight inside a bold label is not bold', JSON.stringify(nb) === JSON.stringify([['Title', 'bold'], ['sub', null]]), nb);
ok('in a table, bad values, ids, events and align on the table itself are dropped', !/onclick|id="x"|9999|url\(|<table[^>]*align/.test(tb.html), tb.html);
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
