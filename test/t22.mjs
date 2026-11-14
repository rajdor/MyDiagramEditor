import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
await pg.evaluate(() => { const E = DiagramEditor; E.mutate(() => { const P = E.page(); const a = E.makeVertex('process', 100, 300), c = E.makeVertex('process', 700, 300), o1 = E.makeVertex('rect', 300, 260), o2 = E.makeVertex('rect', 480, 330); o1.value = 'Obstacle 1'; o2.value = 'Obstacle 2'; const e = E.makeEdge(); e.source = a.id; e.target = c.id; P.cells.push(a, c, o1, o2, e); E.S.sel = [e.id]; }); E.S.zoom = 1; E.S.tx = 0; E.S.ty = 0; });
await sleep(300);
const scr = (x, y) => pg.evaluate((x, y) => { const r = document.querySelector('#viewport').getBoundingClientRect(); const p = DiagramEditor.toScreen({ x, y }); return { x: r.left + p.x, y: r.top + p.y }; }, x, y);
const segs = () => pg.evaluate(() => { const E = DiagramEditor; const e = E.page().cells.find(c => c.e); const r = E.edgeRoute(e, E.refreshMap()); return { pts: e.pts.length, route: r.pts.map(p => [Math.round(p.x), Math.round(p.y)]) }; });
const drag = async (from, to, shift) => { const a = await scr(from[0], from[1]), b2 = await scr(to[0], to[1]); if (shift) await pg.keyboard.down('Shift'); await pg.mouse.move(a.x, a.y); await pg.mouse.down(); await pg.mouse.move(b2.x, b2.y, { steps: 8 }); await pg.mouse.up(); if (shift) await pg.keyboard.up('Shift'); await sleep(150); };
let s = await segs(); console.log('start', JSON.stringify(s));
// drag the single straight segment down: should add 4 bends
let m = [(s.route[0][0] + s.route[1][0]) / 2, s.route[0][1]];
await drag(m, [m[0], 430]); s = await segs(); console.log('after 1', JSON.stringify(s));
// find the middle horizontal segment and Shift+drag to split it upward
const mid = s.route.reduce((best, p, i) => { if (i === 0) return best; const q = s.route[i - 1]; return Math.abs(q[1] - p[1]) < 1 && Math.abs(q[0] - p[0]) > (best ? best.len : 0) ? { i, len: Math.abs(q[0] - p[0]), m: [(q[0] + p[0]) / 2, p[1]] } : best; }, null);
await drag(mid.m, [mid.m[0], 230], true); s = await segs(); console.log('after split', JSON.stringify(s));
await pg.screenshot({ path: 'test/out/s_snake.png', clip: { x: 216, y: 98, width: 956, height: 500 } });
// compare final route with mxGraph
const xml = await pg.evaluate(() => DiagramEditor.serializeDoc(DiagramEditor.S.doc).match(/<mxGraphModel[\s\S]*?<\/mxGraphModel>/)[0]);
const p2 = await b.newPage(); await p2.goto(new URL('mx.html', import.meta.url).href); await sleep(300);
const mx = await p2.evaluate((m) => window.renderXml(m), xml);
console.log('mxGraph route', JSON.stringify(Object.values(mx.edgeInfo)[0]), 'same:', JSON.stringify(Object.values(mx.edgeInfo)[0]) === JSON.stringify(s.route));
console.log(errors.join('\n') || 'no errors');
await b.close();
