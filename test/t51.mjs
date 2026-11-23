// Arrange: the panel's Distribute and Match size buttons, Same width and align left, Same height and align top, the shape
// whose size is used (the first clicked, or the widest, tallest or largest when the selection was made by a drag box),
// and several shapes resized together by the same amount from one shape's handle, as PowerPoint does.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = (name, cond, detail) => { if (!cond) fail(name + (detail === undefined ? '' : ' -> ' + JSON.stringify(detail))); };
await sleep(1200);
const ev = (fn, ...a) => pg.evaluate(fn, ...a);
const setup = () => ev(() => {
  const E = DiagramEditor, S = E.S; S.doc = E.newDoc(); S.pi = 0; S.sel = []; S.undo = []; E.clearCache(); const P = E.page();
  const mk = (id, x, y, w, h) => { const c = E.makeVertex('rect', x, y); c.id = id; c.x = x; c.y = y; c.w = w; c.h = h; c.value = id; P.cells.push(c); return c; };
  mk('A', 100, 50, 120, 60); mk('B', 160, 150, 80, 40); mk('C', 60, 250, 200, 50); mk('D', 400, 400, 50, 50).style.locked = '1';
  E.mutate(() => { }); E.setSel([]);
});
const box = (id) => ev((id) => { const c = DiagramEditor.cellById(id); return [c.x, c.y, c.w, c.h]; }, id);
const click = async (id, shift) => { const p = await ev((id) => { const E = DiagramEditor, S = E.S, c = E.cellById(id), r = document.getElementById('svg').getBoundingClientRect(); return [r.x + (c.x + c.w / 2) * S.zoom + S.tx, r.y + (c.y + c.h / 2) * S.zoom + S.ty]; }, id); if (shift) await pg.keyboard.down('Shift'); await pg.mouse.click(p[0], p[1]); if (shift) await pg.keyboard.up('Shift'); await sleep(80); };
const panelBtn = (label) => ev((l) => { const b = [...document.querySelectorAll('#format .fsec')].find(s => /^Arrange/.test(s.textContent)); const x = b && [...b.querySelectorAll('button')].find(x => (x.getAttribute('aria-label') || x.title || x.textContent).startsWith(l)); if (!x) return 'missing'; if (x.disabled) return 'disabled'; x.click(); return 'ok'; }, label);
await ev(() => { const E = DiagramEditor; E.S.zoom = 1; E.S.tx = 0; E.S.ty = 0; });
await setup(); await ev(() => DiagramEditor.fitView && null);

/* ----- the panel offers them all ----- */
await click('B'); await click('A', true);
for (const l of ['Align left', 'Distribute horizontally', 'Distribute vertically', 'Match width', 'Match height', 'Match width and height', 'Same width', 'Same height']) {
  const has = await ev((l) => { const s = [...document.querySelectorAll('#format .fsec')].find(s => /^Arrange/.test(s.textContent)); return !!s && [...s.querySelectorAll('button')].some(x => (x.getAttribute('aria-label') || x.title || x.textContent).startsWith(l)); }, l);
  ok('the Arrange section has ' + l, has);
}
ok('Distribute is off with two shapes selected', await panelBtn('Distribute horizontally') === 'disabled');

/* ----- same width and align left: the first clicked sets the width ----- */
ok('B was clicked first', await ev(() => DiagramEditor.S.sel[0] === 'B' && !DiagramEditor.S.selAuto));
await panelBtn('Same width');
ok('both take the width of the first shape clicked and line up on the leftmost left edge', JSON.stringify([await box('A'), await box('B')]) === JSON.stringify([[100, 50, 80, 60], [100, 150, 80, 40]]), [await box('A'), await box('B')]);
const u = await ev(() => DiagramEditor.S.undo.length);
ok('it is one undo step', u === 1, u);
await setup(); await click('C'); await click('B', true);
await panelBtn('Same height');
ok('same height and align top: the first clicked sets the height, the topmost top is kept', JSON.stringify([await box('C'), await box('B')]) === JSON.stringify([[60, 150, 200, 50], [160, 150, 80, 50]]), [await box('C'), await box('B')]);

/* ----- a drag box has no first click: the widest sets the width ----- */
await setup();
const pt = (x, y) => ev(([x, y]) => { const S = DiagramEditor.S, r = document.getElementById('svg').getBoundingClientRect(); return [r.x + x * S.zoom + S.tx, r.y + y * S.zoom + S.ty]; }, [x, y]);
let [x0, y0] = await pt(20, 20), [x1, y1] = await pt(300, 330);
await pg.mouse.move(x0, y0); await pg.mouse.down(); await pg.mouse.move((x0 + x1) / 2, (y0 + y1) / 2, { steps: 4 }); await pg.mouse.move(x1, y1, { steps: 4 }); await pg.mouse.up(); await sleep(100);
ok('a drag box selects the three and has no first click', await ev(() => DiagramEditor.S.sel.length === 3 && DiagramEditor.S.selAuto), await ev(() => [DiagramEditor.S.sel, DiagramEditor.S.selAuto]));
await panelBtn('Same width');
ok('then the widest sets the width, on the leftmost left edge', JSON.stringify([await box('A'), await box('B'), await box('C')]) === JSON.stringify([[60, 50, 200, 60], [60, 150, 200, 40], [60, 250, 200, 50]]), [await box('A'), await box('B'), await box('C')]);
await ev(() => DiagramEditor.runCommand('undo'));
await panelBtn('Distribute vertically');
ok('Distribute in the panel spaces the three evenly', await ev(() => { const E = DiagramEditor, a = E.cellById('A'), b = E.cellById('B'), c = E.cellById('C'); return Math.abs((b.y - (a.y + a.h)) - (c.y - (b.y + b.h))) < 0.01; }));
await ev(() => DiagramEditor.runCommand('undo'));
await panelBtn('Match height');
ok('Match height from a drag box uses the tallest, each keeping its centre', JSON.stringify((await box('B')).slice(1, 4)) === JSON.stringify([140, 80, 60]), await box('B'));

/* ----- Select all has no first click either ----- */
await setup(); await ev(() => DiagramEditor.runCommand('selectAll'));
ok('Select all counts as no first click', await ev(() => DiagramEditor.S.selAuto));

/* ----- several shapes resized together ----- */
await setup(); await click('A'); await click('B', true); await click('D', true);
const handles = await ev(() => { const S = DiagramEditor.S; return [...document.querySelectorAll('#overlay rect')].length; });
ok('with several shapes selected each unlocked shape shows its handles', handles >= 16, handles);
const hp = await ev(() => { const E = DiagramEditor, S = E.S, c = E.cellById('B'), r = document.getElementById('svg').getBoundingClientRect(), off = 9 / S.zoom; return [r.x + (c.x + c.w + off) * S.zoom + S.tx, r.y + (c.y + c.h + off) * S.zoom + S.ty]; });
await pg.mouse.move(hp[0], hp[1]); await pg.mouse.down(); await pg.mouse.move(hp[0] + 20, hp[1] + 10, { steps: 3 }); await pg.mouse.move(hp[0] + 40, hp[1] + 20, { steps: 3 }); await pg.mouse.up(); await sleep(100);
const [a, bb, d] = [await box('A'), await box('B'), await box('D')];
ok('dragging one shape\'s corner grows every selected shape by the same amount from its own top left', a[0] === 100 && a[1] === 50 && bb[0] === 160 && bb[1] === 150 && a[2] - 120 === bb[2] - 80 && a[3] - 60 === bb[3] - 40 && bb[2] - 80 === 40 && bb[3] - 40 === 20, [a, bb]);
ok('a locked shape is not resized', JSON.stringify(d) === JSON.stringify([400, 400, 50, 50]), d);
ok('the resize is one undo step', await ev(() => { DiagramEditor.runCommand('undo'); const a = DiagramEditor.cellById('A'), b = DiagramEditor.cellById('B'); return a.w === 120 && b.w === 80 && a.h === 60; }));
// a left edge: the right sides stay put
await ev(() => DiagramEditor.setSel(['A', 'B']));
const lp = await ev(() => { const E = DiagramEditor, S = E.S, c = E.cellById('A'), r = document.getElementById('svg').getBoundingClientRect(), off = 9 / S.zoom; return [r.x + (c.x - off) * S.zoom + S.tx, r.y + (c.y + c.h / 2) * S.zoom + S.ty]; });
await pg.mouse.move(lp[0], lp[1]); await pg.mouse.down(); await pg.mouse.move(lp[0] - 20, lp[1], { steps: 3 }); await pg.mouse.move(lp[0] - 30, lp[1], { steps: 3 }); await pg.mouse.up(); await sleep(100);
const [a2, b2] = [await box('A'), await box('B')];
ok('dragging a left edge widens each to the left, right sides and heights unchanged', a2[0] + a2[2] === 220 && b2[0] + b2[2] === 240 && a2[2] - 120 === b2[2] - 80 && a2[2] > 120 && a2[3] === 60 && b2[3] === 40, [a2, b2]);
ok('no page errors', !errors.length, errors);
if (!process.exitCode) console.log('Arrange checks passed');
await b.close();
