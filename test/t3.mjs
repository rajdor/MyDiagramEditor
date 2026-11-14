import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const scr = (wx, wy) => pg.evaluate((wx, wy) => { const r = document.querySelector('#viewport').getBoundingClientRect(); const p = DiagramEditor.toScreen({ x: wx, y: wy }); return { x: r.left + p.x, y: r.top + p.y }; }, wx, wy);
const st = () => pg.evaluate(() => { const S = DiagramEditor.S; return { n: DiagramEditor.page().cells.length, sel: S.sel.slice(), cells: DiagramEditor.page().cells.map(c => ({ id: c.id, e: !!c.e, v: c.value, x: c.x, y: c.y, w: c.w, h: c.h, s: c.source, t: c.target, st: Object.assign({}, c.style), lbl: !!c.isEdgeLabel })) }; });
const log = (...a) => console.log(...a);
// 1. add two shapes from palette by clicking
const tiles = await pg.$$('.ptile');
await tiles[4].click(); await sleep(200);   // process
await tiles[5].click(); await sleep(200);   // decision
let s = await st(); log('after palette clicks: cells', s.n, 'values', s.cells.map(c => c.v));
const A = s.cells[0], B = s.cells[1];
// 2. move B away by dragging
let p = await scr(B.x + B.w / 2, B.y + B.h / 2);
await pg.mouse.move(p.x, p.y); await pg.mouse.down(); await pg.mouse.move(p.x + 100, p.y + 40, { steps: 6 }); await pg.mouse.move(p.x + 250, p.y + 120, { steps: 6 }); await pg.mouse.up(); await sleep(100);
s = await st(); const B2 = s.cells[1]; log('B moved from', B.x, B.y, 'to', B2.x, B2.y, '(snapped to 10:', B2.x % 10 === 0 && B2.y % 10 === 0, ')');
// 3. draw line from A right-middle point to B top-middle point
const pA = await scr(A.x + A.w, A.y + A.h / 2);
await pg.mouse.move(pA.x - 30, pA.y); await pg.mouse.move(pA.x, pA.y, { steps: 3 }); await sleep(100);
const hp = await pg.evaluate(() => DiagramEditor.S.hoverPoint && DiagramEditor.S.hoverPoint.rel);
log('hover point at A right middle:', JSON.stringify(hp));
const pB = await scr(B2.x + B2.w / 2, B2.y);
await pg.mouse.down(); await pg.mouse.move(pB.x - 40, pB.y - 30, { steps: 5 }); await pg.mouse.move(pB.x, pB.y + 1, { steps: 5 }); await sleep(50); await pg.mouse.up(); await sleep(100);
s = await st(); const E = s.cells.find(c => c.e); log('edge:', E && JSON.stringify({ s: E.s === A.id, t: E.t === B.id, exit: [E.st.exitX, E.st.exitY], entry: [E.st.entryX, E.st.entryY] }));
// 4. double-click A, type text, escape
p = await scr(A.x + A.w / 2, A.y + A.h / 2);
await pg.mouse.click(p.x, p.y, { count: 1 }); await pg.mouse.click(p.x, p.y, { count: 2 }); await sleep(150);
await pg.keyboard.type('Hello world'); await pg.keyboard.down('Control'); await pg.keyboard.press('Enter'); await pg.keyboard.up('Control'); await sleep(150);
s = await st(); log('A text:', s.cells.find(c => c.id === A.id).v);
// 5. select A and resize from se handle
await pg.mouse.click(p.x, p.y); await sleep(100);
const se = await scr(A.x + A.w + 9, A.y + A.h + 9);
await pg.mouse.move(se.x, se.y); await pg.mouse.down(); await pg.mouse.move(se.x + 40, se.y + 20, { steps: 5 }); await pg.mouse.up(); await sleep(100);
s = await st(); const A2 = s.cells.find(c => c.id === A.id); log('A resized:', A.w, A.h, '->', A2.w, A2.h);
// 6. rotate via handle
const rh = await pg.evaluate(() => { const r = document.querySelector('#viewport').getBoundingClientRect(); const c = DiagramEditor.cellById(DiagramEditor.S.sel[0]); const p = DiagramEditor.toScreen({ x: c.x + c.w / 2, y: c.y - 32 / DiagramEditor.S.zoom }); return { x: r.left + p.x, y: r.top + p.y, cx: r.left + DiagramEditor.toScreen({ x: c.x + c.w / 2, y: c.y + c.h / 2 }).x, cy: r.top + DiagramEditor.toScreen({ x: c.x + c.w / 2, y: c.y + c.h / 2 }).y }; });
await pg.mouse.move(rh.x, rh.y); await pg.mouse.down(); await pg.mouse.move(rh.cx + 80, rh.cy - 40, { steps: 8 }); await pg.mouse.up(); await sleep(100);
s = await st(); log('A rotation:', s.cells.find(c => c.id === A.id).st.rotation);
// 7. undo x2, redo
await pg.keyboard.down('Control'); await pg.keyboard.press('z'); await pg.keyboard.press('z'); await pg.keyboard.up('Control'); await sleep(100);
s = await st(); const A3 = s.cells.find(c => c.id === A.id); log('after 2 undo: rot', A3.st.rotation, 'size', A3.w, A3.h);
await pg.keyboard.down('Control'); await pg.keyboard.press('y'); await pg.keyboard.up('Control'); await sleep(100);
s = await st(); log('after redo: size', s.cells.find(c => c.id === A.id).w);
// 8. double-click line to add label
const mid = await pg.evaluate(() => { const S = DiagramEditor.S; const e = DiagramEditor.page().cells.find(c => c.e); const r = S.routes.get(e.id); const p = r.pts[Math.floor(r.pts.length / 2)], q = r.pts[Math.floor(r.pts.length / 2) - 1]; const m = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; const vr = document.querySelector('#viewport').getBoundingClientRect(); const sp = DiagramEditor.toScreen(m); return { x: vr.left + sp.x, y: vr.top + sp.y }; });
await pg.mouse.click(mid.x, mid.y, { count: 1 }); await pg.mouse.click(mid.x, mid.y, { count: 2 }); await sleep(150);
await pg.keyboard.type('yes'); await pg.keyboard.down('Control'); await pg.keyboard.press('Enter'); await pg.keyboard.up('Control'); await sleep(150);
s = await st(); log('labels:', s.cells.filter(c => c.lbl).map(c => c.v));
// 9. save round trip
const rt = await pg.evaluate(async () => { const x1 = DiagramEditor.serializeDoc(DiagramEditor.S.doc); const d = await DiagramEditor.parseDrawio(x1); const x2 = DiagramEditor.serializeDoc(d); return { same: x1 === x2, len: x1.length, x1, x2 }; });
log('round trip identical:', rt.same, rt.len); if(!rt.same){ const a=rt.x1.split('\n'), b2=rt.x2.split('\n'); for(let i=0;i<a.length;i++) if(a[i]!==b2[i]){ log('DIFF1', a[i]); log('DIFF2', b2[i]); break; } }
await pg.screenshot({ path: 'test/out/s_inter.png' });

console.log(errors.join('\n') || 'no errors');
await b.close();
