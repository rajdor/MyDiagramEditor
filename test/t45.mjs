// BUG-002: the points shown by Edit points are the points a line can attach to. A shape that still has its default
// points shows, in Edit points, exactly the points it offers on hover; a point added, moved or removed there is offered
// straight away; a line can be drawn from it and to it; other shapes stay connectable while one is being edited;
// points too crowded to offer at the current zoom are shown faded.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = (name, cond, detail) => { if (cond) console.log('ok   ' + name); else fail(name + (detail === undefined ? '' : '  -> ' + JSON.stringify(detail))); };
const same = (name, a, e) => ok(name, JSON.stringify(a) === JSON.stringify(e), { expected: e, actual: a });

const ids = await pg.evaluate(() => { const E = DiagramEditor; let a, c; E.mutate(() => { a = E.makeVertex('rect', 160, 160); c = E.makeVertex('rect', 480, 160); E.page().cells.push(a, c); }); E.S.zoom = 1; E.S.tx = 0; E.S.ty = 0; E.setSel([]); return [a.id, c.id]; });
await sleep(200);
const scr = (id, rel) => pg.evaluate((id, rel) => { const E = DiagramEditor, c = E.cellById(id), q = E.constraintPoint(c, rel), p = E.toScreen(q), r = document.querySelector('#viewport').getBoundingClientRect(); return [r.left + p.x, r.top + p.y]; }, id, rel);
const key = (p) => p.map(v => Math.round(v * 1000) / 1000).join(',');
const st = () => pg.evaluate((id) => { const E = DiagramEditor, c = E.cellById(id), k = (p) => p.map(v => Math.round(v * 1000) / 1000).join(','); return { stored: E.getPoints(c).map(k), offered: E.offeredPoints(c).map(k), working: E.workingPoints(c).map(k), handles: E.getHandles().filter(h => h.type === 'cpoint').length, faded: E.getHandles().filter(h => h.type === 'cpoint' && h.hid).length, edit: E.S.editPoints, hp: E.S.hoverPoint && [E.S.hoverPoint.id, k(E.S.hoverPoint.rel)], edges: E.page().cells.filter(x => x.e).map(e => [e.source, e.target, e.style.exitX, e.style.exitY, e.style.entryX, e.style.entryY]) }; }, ids[0]);
const hover = async (id, rel) => { const p = await scr(id, rel); await pg.mouse.move(p[0] + 30, p[1] + 24); await pg.mouse.move(p[0] + 2, p[1] + 2, { steps: 3 }); await pg.mouse.move(p[0], p[1]); await sleep(120); return p; };
const editBtn = (label) => pg.evaluate((label) => { const x = Array.from(document.querySelectorAll('#format .btn')).find(b2 => b2.textContent === label); if (x) x.click(); return !!x; }, label);
const hint = () => pg.evaluate(() => { const h = Array.from(document.querySelectorAll('#format .hint')).find(x => /points\./.test(x.textContent)); return h ? h.textContent : ''; });

// a default 120 x 60 rectangle at 100%: 12 stored points, 8 offered on hover
let s = await st();
same('a new rectangle stores its 12 default points and offers 8 at this size', [s.stored.length, s.offered.length], [12, 8]);
await pg.evaluate((id) => DiagramEditor.setSel([id]), ids[0]); await sleep(100);
ok('Edit points is offered for the selected shape', await editBtn('Edit points')); await sleep(150);
s = await st();
same('Edit points shows exactly the points offered on hover, not the stored defaults', [s.handles, s.working], [8, s.offered]);
ok('the panel counts those points and says they are the ones a line can attach to', /^8 points\./.test(await hint()) && /points a line can attach to/.test(await hint()), await hint());
// add a point on the top edge
let p = await scr(ids[0], [0.9, 0]); await pg.mouse.click(p[0], p[1]); await sleep(150);
s = await st();
ok('a point added in Edit points is stored with the points that were shown', s.stored.length === 9 && s.stored.includes('0.9,0') && s.offered.includes('0.9,0'), s);
same('and every point shown is now offered', [s.handles, s.offered.length], [9, 9]);
// while editing: the edited shape offers nothing to drag from, but the other shape does
await hover(ids[0], [0.9, 0]);
same('the shape being edited shows edit handles, not line starts', (await st()).hp, null);
await hover(ids[1], [0, 0.5]);
same('another shape still offers its points while this one is being edited', (await st()).hp, [ids[1], '0,0.5']);
await pg.mouse.move(100, 500); await sleep(80);
ok('Done ends the editing', await editBtn('Done')); await sleep(120);
// draw a line from the added point to the other shape
p = await hover(ids[0], [0.9, 0]);
same('after Done the added point can be hovered', (await st()).hp, [ids[0], '0.9,0']);
let t = await scr(ids[1], [0, 0.5]);
await pg.mouse.down(); await pg.mouse.move(p[0] + 30, p[1] - 30, { steps: 4 }); await pg.mouse.move(t[0], t[1], { steps: 8 }); await sleep(80); await pg.mouse.up(); await sleep(200);
s = await st();
same('a line drawn from the added point starts there and ends on the other shape', s.edges, [[ids[0], ids[1], '0.9', '0', '0', '0.5']]);
// and a line can be drawn to an added point
await pg.evaluate((id) => DiagramEditor.setSel([id]), ids[0]); await sleep(80); await editBtn('Edit points'); await sleep(120);
p = await scr(ids[0], [1, 0.8]); await pg.mouse.click(p[0], p[1]); await sleep(120); await pg.mouse.move(100, 500); await editBtn('Done'); await sleep(120);
p = await hover(ids[1], [0.5, 1]); t = await scr(ids[0], [1, 0.8]);
await pg.mouse.down(); await pg.mouse.move(p[0] + 20, p[1] + 40, { steps: 4 }); await pg.mouse.move(t[0], t[1], { steps: 8 }); await sleep(80); await pg.mouse.up(); await sleep(200);
s = await st();
ok('a line can be dropped on an added point', s.edges.some(e => e[0] === ids[1] && e[1] === ids[0] && e[4] === '1' && e[5] === '0.8'), s.edges);
// starting a line from another shape while editing ends the editing
await pg.evaluate((id) => DiagramEditor.setSel([id]), ids[0]); await sleep(80); await editBtn('Edit points'); await sleep(120);
p = await hover(ids[1], [1, 0.5]); await pg.mouse.down(); await pg.mouse.move(p[0] + 60, p[1] + 10, { steps: 4 }); await pg.mouse.up(); await sleep(200);
s = await st();
ok('dragging a line from another shape while editing draws the line and ends the editing', s.edit === null && s.edges.length === 3, s);
await pg.keyboard.down('Control'); await pg.keyboard.press('z'); await pg.keyboard.up('Control'); await sleep(150);
// crowded points are shown faded and are not offered
await pg.evaluate((id) => { const E = DiagramEditor; E.mutate(() => { const c = E.cellById(id); E.setPoints(c, E.getPoints(c).concat([[0.96, 0]])); }); E.setSel([id]); }, ids[0]); await sleep(100); await editBtn('Edit points'); await sleep(150);
s = await st();
ok('a point too close to another is shown faded and is not offered', s.faded === 1 && s.handles === s.offered.length + 1 && /1 is too close/.test(await hint()), [s.faded, s.handles, s.offered.length, await hint()]);
await pg.evaluate(() => { DiagramEditor.S.zoom = 3; DiagramEditor.requestRender(); DiagramEditor.buildFormat(); }); await sleep(150);
s = await st();
ok('zoomed in, it is offered and no longer faded', s.faded === 0 && s.offered.includes('0.96,0') && !/too close/.test(await hint()), [s.faded, await hint()]);
await pg.evaluate(() => { DiagramEditor.S.zoom = 1; DiagramEditor.requestRender(); }); await editBtn('Done'); await sleep(100);
// Reset to defaults goes back to the size-based points
await pg.evaluate(() => { const x = Array.from(document.querySelectorAll('#format .btn')).find(b2 => b2.textContent === 'Reset to defaults'); x.click(); }); await sleep(150);
s = await st();
same('Reset to defaults restores the 12 stored points and the 8 offered', [s.stored.length, s.offered.length], [12, 8]);
// removing a point from a shape that still has its defaults stores what was shown, less that point
await pg.evaluate((id) => DiagramEditor.setSel([id]), ids[0]); await sleep(80); await editBtn('Edit points'); await sleep(120);
p = await scr(ids[0], [0.5, 0]); await pg.mouse.click(p[0], p[1]); await sleep(100); await pg.keyboard.press('Delete'); await sleep(150);
s = await st();
ok('deleting a shown point leaves the other 7, all offered', s.stored.length === 7 && !s.stored.includes('0.5,0') && s.offered.length === 7 && s.handles === 7, s);
await editBtn('Done');
console.log(errors.join('\n') || 'no errors');
await b.close();
