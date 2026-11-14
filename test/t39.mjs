// Presets (right panel): 8 filled colours, the same 8 as outlines, Subtle and Bold. A preset sets colours directly,
// overriding the diagram style like a manual change: in Sketch with fill style None, a filled preset gives the shape
// its fill colour; an outline preset removes the fill. Open containers keep no fill.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = (c, m) => { if (!c) fail(m); else console.log('ok: ' + m); };
await sleep(900);
const click = async (title) => { await pg.evaluate((t) => { const s = [...document.querySelectorAll('#format .swatches.presets .sw')].find(x => x.title.split(':')[0] === t); if (!s) throw new Error('no preset ' + t); s.click(); }, title); await sleep(120); };
const cell = (id) => pg.evaluate((id) => { const c = DiagramEditor.cellById(id); return Object.assign({}, c.style); }, id);
const sel = (id) => pg.evaluate((id) => { DiagramEditor.setSel([id]); }, id);

// Sketch with fill style None, then a new shape
const ids = await pg.evaluate(() => {
  const E = DiagramEditor; E.setDiagramStyle('sketch', { fillStyle: 'none' });
  const add = (k, x) => { const c = E.makeVertex(k, x, 80, 'sketch'); E.mutate(() => E.page().cells.push(c)); return c.id; };
  return { a: add('process', 60), box: add('container', 300) };
});
let st = await cell(ids.a);
ok(st.fillColor === 'none' && st.sketch === '1', 'Sketch with fill style None: a new shape has no fill');
await sel(ids.a);
const titles = await pg.evaluate(() => [...document.querySelectorAll('#format .swatches.presets .sw')].map(s => s.title.split(':')[0]));
ok(titles.length === 18 && titles[8] === 'Slate outline' && titles[15] === 'Pink outline' && titles[16] === 'Subtle' && titles[17] === 'Bold', '18 presets: 8 filled, 8 outline, Subtle, Bold');
await click('Blue');
st = await cell(ids.a);
ok(st.fillColor === '#dbeafe' && st.strokeColor === '#3b82f6' && st.fontColor === '#1e3a8a', 'Blue gives the fill colour in Sketch with fill None (' + st.fillColor + ')');
ok(st.sketch === '1', 'the shape stays hand-drawn');
const filled = await pg.evaluate((id) => [...document.querySelectorAll('#content [data-id="' + id + '"] path')].some(p => /#dbeafe|219, 234, 254/i.test(p.getAttribute('stroke') + p.getAttribute('fill') + p.getAttribute('style'))), ids.a);
ok(filled, 'the fill is drawn on the canvas');
ok(await pg.evaluate(() => document.querySelector('#format .swatches.presets .sw.on').title.startsWith('Blue') && !document.querySelector('#format .swatches.presets .sw.on').title.includes('outline')), 'the Blue preset is shown as current');
await click('Blue outline');
st = await cell(ids.a);
ok(st.fillColor === 'none' && st.strokeColor === '#3b82f6' && st.fontColor === '#1e3a8a', 'Blue outline: border and text in blue, no fill');
ok(await pg.evaluate(() => document.querySelector('#format .swatches.presets .sw.on').title.startsWith('Blue outline')), 'the Blue outline preset is shown as current');
await click('Green');
st = await cell(ids.a);
ok(st.fillColor === '#dcfce7', 'a filled preset after an outline preset brings the fill back');
await click('Subtle'); st = await cell(ids.a);
ok(st.fillColor === 'none' && st.dashed === '1', 'Subtle gives a transparent fill and a dashed outline');
ok(await pg.evaluate(() => { const l = [...document.querySelectorAll('#format label.chk')].find(x => x.textContent === 'Transparent'); return !!l && l.querySelector('input').checked; }), 'the Fill checkbox is called Transparent and is ticked');
await click('Red');
st = await cell(ids.a);
ok(st.fillColor === '#fee2e2' && st.dashed === undefined, 'after Subtle, a filled preset fills and removes the dashes');
// undo: one step per preset
const u = await pg.evaluate(() => { const E = DiagramEditor; E.runCommand('undo'); return E.cellById(E.S.sel[0]).style.fillColor; });
ok(u === 'none', 'one undo step per preset');
// open container: filled preset keeps it open, outline preset still works
await sel(ids.box);
await click('Purple');
st = await cell(ids.box);
ok(st.fillColor === 'none' && st.strokeColor === '#8b5cf6', 'an open container takes the colours but stays unfilled');
// Outline style: presets behave the same
const o = await pg.evaluate(() => { const E = DiagramEditor; E.setDiagramStyle('outline', {}); const c = E.makeVertex('rect', 60, 300, 'outline'); E.mutate(() => E.page().cells.push(c)); E.setSel([c.id]); return c.id; });
await click('Teal outline'); st = await cell(o);
ok(st.fillColor === 'none' && st.strokeColor === await pg.evaluate(() => DiagramEditor.PALETTE.find(p => p.name === 'Teal').stroke), 'outline presets work in the Outline style');
await click('Teal'); st = await cell(o);
ok(st.fillColor === '#ccfbf1', 'filled presets work in the Outline style');
console.log(errors.join('\n') || 'no errors');
console.log(process.exitCode ? 'Presets test FAILED' : 'Presets test passed');
await b.close();
