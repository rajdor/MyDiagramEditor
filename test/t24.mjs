import { open } from './harness.mjs';
const { b, pg } = await open();
const r = await pg.evaluate(() => {
  const E = DiagramEditor; let seed = 9; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  E.mutate(() => { const P = E.page(); const vs = []; for (let i = 0; i < 15; i++) { const c = E.makeVertex('process', Math.round(rnd() * 900), Math.round(rnd() * 600)); P.cells.push(c); vs.push(c); }
    for (let i = 0; i < 20; i++) { const e = E.makeEdge(); e.source = vs[Math.floor(rnd() * 15)].id; e.target = vs[Math.floor(rnd() * 15)].id; if (e.source !== e.target) P.cells.push(e); } });
  const bends = () => E.page().cells.filter(c => c.e).reduce((a, e) => a + (e.pts || []).length, 0);
  const out = {};
  E.mutate(() => E.minimiseCrossings(E.page().cells.filter(c => c.e))); out.afterLinesOnly = bends();
  E.mutate(() => E.layeredLayout({ dir: 'TB', layerGap: 70, nodeGap: 40 })); out.afterLayered = bends();
  out.maxBendsInAnyRoute = Math.max(...E.page().cells.filter(c => c.e).map(e => E.edgeRoute(e, E.refreshMap()).pts.length - 2));
  return out;
});
console.log('manual bends added by auto arrange:', JSON.stringify(r));
await b.close();
// guard: automation must not create elbow-heavy lines
if (r.afterLinesOnly || r.afterLayered || r.maxBendsInAnyRoute > 5) { console.error('FAIL: auto arrange produced too many bends'); process.exit(1); }
console.log('PASS');
