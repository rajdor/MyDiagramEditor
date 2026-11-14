import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const r = await pg.evaluate(() => {
  const E = DiagramEditor; let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const P = E.page(); const vs = [];
  for (let i = 0; i < 20; i++) { const c = E.makeVertex('rect', Math.round(rnd() * 1000), Math.round(rnd() * 700)); P.cells.push(c); vs.push(c); }
  let okCorners = 0, okMid = 0, n = 0; const fails = [];
  for (let i = 0; i < 80; i++) {
    const a = vs[Math.floor(rnd() * 20)], t = vs[Math.floor(rnd() * 20)]; if (a === t) continue;
    const e = E.makeEdge(); e.source = a.id; e.target = t.id;
    if (rnd() < 0.5) { const p = E.getPoints(a)[Math.floor(rnd() * 12)]; e.style.exitX = '' + p[0]; e.style.exitY = '' + p[1]; }
    if (rnd() < 0.5) { const p = E.getPoints(t)[Math.floor(rnd() * 12)]; e.style.entryX = '' + p[0]; e.style.entryY = '' + p[1]; }
    P.cells.push(e); const map = E.refreshMap();
    const R = E.edgeRoute(e, map).pts; if (R.length < 3) { P.cells.pop(); continue; } n++;
    e.pts = R.slice(1, -1); const R1 = E.edgeRoute(e, map).pts;
    if (JSON.stringify(R1.map(p => [Math.round(p.x), Math.round(p.y)])) === JSON.stringify(R.map(p => [Math.round(p.x), Math.round(p.y)]))) okCorners++; else if (fails.length < 3) fails.push([R, R1]);
    const mids = []; for (let k = 1; k < R.length - 2; k++) mids.push({ x: (R[k].x + R[k + 1].x) / 2, y: (R[k].y + R[k + 1].y) / 2 });
    e.pts = mids.length ? mids : R.slice(1, -1); const R2 = E.edgeRoute(e, map).pts;
    if (JSON.stringify(R2.map(p => [Math.round(p.x), Math.round(p.y)])) === JSON.stringify(R.map(p => [Math.round(p.x), Math.round(p.y)]))) okMid++;
    P.cells.pop();
  }
  return { n, okCorners, okMid, fails: JSON.stringify(fails).slice(0, 600) };
});
console.log(r);
await b.close();
