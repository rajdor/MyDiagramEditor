// Copy and paste style, and the colour panel. Style: fonts, colours, fill, line, shadow and Blueprint state go across;
// text, size, place and the kind of shape stay; a line takes only line and text from a shape; colours set on words in
// the label come off; one undo step; Alt+Shift+C and Alt+Shift+V; the painter once and kept, Esc to stop; locked shapes
// left alone. Colour panel: the colour is previewed, OK keeps it as one undo step, Cancel, Esc and a click elsewhere put
// it back; the hex box; while a label is edited, OK colours the selected words.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = (name, cond, detail) => { if (!cond) fail(name + (detail === undefined ? '' : ' -> ' + JSON.stringify(detail))); };
await sleep(1200);
const ev = (fn, ...a) => pg.evaluate(fn, ...a);
const setup = () => ev(() => {
  const E = DiagramEditor, S = E.S; S.doc = E.newDoc(); S.pi = 0; S.sel = []; S.undo = []; S.redo = []; S.styleClip = null; E.clearCache();
  const P = E.page();
  const a = E.makeVertex('rect', 40, 40); a.id = 'A'; a.value = 'Source'; Object.assign(a.style, { fillColor: '#fee2e2', strokeColor: '#ef4444', strokeWidth: '3', dashed: '1', fontColor: '#7f1d1d', fontSize: '18', fontFamily: 'Georgia', fontStyle: '1', rounded: '1', deShadow: '1', deShadowColor: '#112233', deShadowOpacity: '40', deShadowDx: '4', deShadowDy: '4' });
  const t = E.makeVertex('ellipse', 300, 40); t.id = 'T'; t.value = 'Target <span style="color:#00ff00;font-size:30px">green</span> <b>bold</b>'; t.w = 200; t.h = 90;
  const k = E.makeVertex('rect', 40, 300); k.id = 'K'; k.value = 'Locked'; k.style.locked = '1';
  const l = E.makeEdge ? null : null;
  P.cells.push(a, t, k); E.mutate(() => { }); return [Object.keys(t.style).filter(x => /^(ellipse|shape)$/.test(x)), t.style.shape || ''];
});
const key = async (k) => { await pg.keyboard.down('Alt'); await pg.keyboard.down('Shift'); await pg.keyboard.press(k); await pg.keyboard.up('Shift'); await pg.keyboard.up('Alt'); await sleep(150); };
const shape0 = await setup();
await ev(() => { DiagramEditor.setSel(['A']); }); await pg.mouse.move(700, 500); await key('KeyC');
ok('Alt+Shift+C copies the style', await ev(() => !!DiagramEditor.S.styleClip));
await ev(() => { DiagramEditor.setSel(['T', 'K']); }); const u0 = await ev(() => DiagramEditor.S.undo.length); await key('KeyV');
const t = await ev(() => { const c = DiagramEditor.cellById('T'), k = DiagramEditor.cellById('K'); return { st: c.style, v: c.value, w: c.w, x: c.x, kind: DiagramEditor.shapeKind(c), kst: k.style, undo: DiagramEditor.S.undo.length }; });
ok('fill, line, dash, rounding and shadow go across', t.st.fillColor === '#fee2e2' && t.st.strokeColor === '#ef4444' && t.st.strokeWidth === '3' && t.st.dashed === '1' && t.st.rounded === '1' && t.st.deShadow === '1' && t.st.deShadowColor === '#112233', t.st);
ok('fonts go across', t.st.fontColor === '#7f1d1d' && t.st.fontSize === '18' && t.st.fontFamily === 'Georgia' && t.st.fontStyle === '1', t.st);
ok('the kind of shape, its text, size and place stay', t.kind === 'ellipse' && t.w === 200 && t.x === 300 && /Target/.test(t.v) && /green/.test(t.v), t);
ok('colours and sizes set on words in the label come off, bold stays', !/#00ff00|30px|<span/.test(t.v) && /<b>bold<\/b>/.test(t.v), t.v);
ok('a locked shape is left alone', t.kst.fillColor !== '#fee2e2', t.kst);
ok('one paste is one undo step', t.undo === u0 + 1, [u0, t.undo]);
await ev(() => DiagramEditor.runCommand('undo'));
ok('Undo puts the target back', await ev(() => DiagramEditor.cellById('T').style.fillColor !== '#fee2e2'));
// a property the source does not have is taken off the target
await ev(() => { const E = DiagramEditor, a = E.cellById('A'), t = E.cellById('T'); delete a.style.dashed; t.style.dashed = '1'; E.setSel(['A']); E.runCommand('copyStyle'); E.setSel(['T']); E.runCommand('pasteStyle'); });
ok('what the source does not have comes off the target (no dash)', await ev(() => DiagramEditor.cellById('T').style.dashed === undefined));
// shape to line: line and text only
const line = await ev(() => { const E = DiagramEditor, P = E.page(); const e = { id: 'L', e: true, value: '', style: { endArrow: 'block', strokeColor: '#000000', html: '1' }, source: 'A', target: 'T', pts: [] }; P.cells.push(e); E.mutate(() => { }); E.setSel(['A']); E.runCommand('copyStyle'); E.setSel(['L']); E.runCommand('pasteStyle'); const c = E.cellById('L'); return c.style; });
ok('a line takes the line colour, width and text from a shape, and keeps its arrow, with no fill', line.strokeColor === '#ef4444' && line.strokeWidth === '3' && line.fontColor === '#7f1d1d' && line.endArrow === 'block' && line.fillColor === undefined, line);
// the painter
await setup();
const pt = (id) => ev((id) => { const E = DiagramEditor, c = E.cellById(id), r = document.getElementById('svg').getBoundingClientRect(), S = E.S; return [r.x + (c.x + c.w / 2) * S.zoom + S.tx, r.y + (c.y + c.h / 2) * S.zoom + S.ty]; }, id);
await ev(() => { const E = DiagramEditor, P = E.page(), c = E.makeVertex('rect', 40, 160); c.id = 'U'; c.value = 'Two'; P.cells.push(c); E.mutate(() => { }); E.setSel(['A']); E.buildFormat(); });
await pg.click('#format .styleCopy button[aria-label="Paint the style"]'); await sleep(400);
ok('the painter button arms the painter', await ev(() => !!DiagramEditor.S.painter && !DiagramEditor.S.painter.keep));
let [x, y] = await pt('T'); await pg.mouse.click(x, y); await sleep(150);
ok('clicking a shape paints it and ends the painter', await ev(() => DiagramEditor.cellById('T').style.fillColor === '#fee2e2' && !DiagramEditor.S.painter));
await ev(() => { DiagramEditor.setSel(['A']); DiagramEditor.buildFormat(); });
await pg.click('#format .styleCopy button[aria-label="Paint the style"]', { count: 2 }); await sleep(400);
ok('a double-click keeps the painter on', await ev(() => !!DiagramEditor.S.painter && DiagramEditor.S.painter.keep));
[x, y] = await pt('U'); await pg.mouse.click(x, y); await sleep(150);
ok('and it stays on after a shape is painted', await ev(() => DiagramEditor.cellById('U').style.fillColor === '#fee2e2' && !!DiagramEditor.S.painter));
await pg.keyboard.press('Escape'); await sleep(100);
ok('Esc stops it', await ev(() => !DiagramEditor.S.painter));
const items = await ev(() => { const m = [...document.querySelectorAll('#menus *')].find(e => e.textContent.trim() === 'Edit'); m.click(); const t = [...document.querySelectorAll('#menuPopup *')].filter(e => !e.children.length).map(e => e.textContent.trim()); m.click(); return t; });
ok('the Edit menu offers Copy style and Paste style with their keys', items.includes('Copy style') && items.includes('Paste style') && items.includes('Alt+Shift+C'), items);

/* ----- the colour panel ----- */
await setup();
await ev(() => { DiagramEditor.setSel(['T']); DiagramEditor.buildFormat(); });
const fillBtn = () => ev(() => { const s = [...document.querySelectorAll('#format .fsec')].find(x => /^(Fill|Shape|Style)/.test(x.querySelector('h3').textContent) && x.querySelector('.colorBtn')); return !!s; });
const openFill = async () => { await ev(() => { const btn = [...document.querySelectorAll('#format .colorBtn')][0]; btn.click(); }); await sleep(100); };
const fill0 = await ev(() => DiagramEditor.cellById('T').style.fillColor);
await openFill();
ok('a colour button opens the colour panel with OK and Cancel', await ev(() => !!document.querySelector('.colorPanel .cpOk') && !!document.querySelector('.colorPanel .cpCancel')));
const u1 = await ev(() => DiagramEditor.S.undo.length);
await ev(() => document.querySelector('.colorPanel .sw[data-c="#ef4444"]').click()); await sleep(50);
ok('a swatch previews on the shape', await ev(() => DiagramEditor.cellById('T').style.fillColor === '#ef4444'));
await ev(() => document.querySelector('.colorPanel .cpCancel').click()); await sleep(50);
ok('Cancel puts the colour back and adds no undo step', await ev((f) => DiagramEditor.cellById('T').style.fillColor === f && !document.querySelector('.colorPanel'), fill0) && await ev(() => DiagramEditor.S.undo.length) === u1);
await openFill(); await ev(() => document.querySelector('.colorPanel .sw[data-c="#ef4444"]').click()); await pg.keyboard.press('Escape'); await sleep(50);
ok('Esc cancels', await ev((f) => DiagramEditor.cellById('T').style.fillColor === f, fill0));
await openFill(); await ev(() => document.querySelector('.colorPanel .sw[data-c="#ef4444"]').click()); await pg.mouse.click(5, 300); await sleep(80);
ok('a click elsewhere cancels', await ev((f) => DiagramEditor.cellById('T').style.fillColor === f && !document.querySelector('.colorPanel'), fill0));
await openFill(); await ev(() => { const h = document.querySelector('.colorPanel .cpHex'); h.value = '123abc'; h.dispatchEvent(new Event('input')); }); await sleep(50);
ok('the hex box takes a code without its #', await ev(() => DiagramEditor.cellById('T').style.fillColor === '#123abc'));
await ev(() => document.querySelector('.colorPanel .cpOk').click()); await sleep(80);
ok('OK keeps it as one undo step', await ev(() => DiagramEditor.cellById('T').style.fillColor === '#123abc') && await ev(() => DiagramEditor.S.undo.length) === u1 + 1);
// editing a label: OK colours the selected words
await ev(() => { const E = DiagramEditor, c = E.cellById('A'); c.value = 'one two'; E.setSel(['A']); E.startEdit(c); });
await sleep(150);
await ev(() => { const ed = DiagramEditor.S.editing.ed, tn = [...ed.childNodes].find(n => n.nodeType === 3 && /two/.test(n.data)) || ed.firstChild; const r = document.createRange(); const i = tn.data.indexOf('two'); r.setStart(tn, i); r.setEnd(tn, i + 3); const s = getSelection(); s.removeAllRanges(); s.addRange(r); });
await ev(() => { const s = [...document.querySelectorAll('#format .fsec')].find(x => /^Text/.test(x.querySelector('h3').textContent)); s.querySelector('.colorBtn').click(); }); await sleep(80);
await ev(() => document.querySelector('.colorPanel .sw[data-c="#3b82f6"]').click()); await sleep(50);
ok('while editing a label nothing is previewed', await ev(() => !/3b82f6|59, 130, 246/i.test(DiagramEditor.S.editing.ed.innerHTML)));
await ev(() => document.querySelector('.colorPanel .cpOk').click()); await sleep(80);
const edHtml = await ev(() => DiagramEditor.S.editing ? DiagramEditor.S.editing.ed.innerHTML : DiagramEditor.cellById('A').value);
ok('OK colours the selected words only', /(3b82f6|59, 130, 246)/i.test(edHtml) && /one/.test(edHtml), edHtml);
ok('no page errors', !errors.length, errors);
if (!process.exitCode) console.log('Style copy and colour panel checks passed');
await b.close();
