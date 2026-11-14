import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const data = await pg.evaluate(() => {
  const E = DiagramEditor; let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  E.mutate(() => {
    const P = E.page(); const vs = [];
    const keys = ['rect', 'rounded', 'ellipse', 'decision', 'process', 'terminator'];
    for (let i = 0; i < 30; i++) { const c = E.makeVertex(keys[Math.floor(rnd() * keys.length)], Math.round(rnd() * 1400 / 10) * 10, Math.round(rnd() * 900 / 10) * 10); P.cells.push(c); vs.push(c); }
    for (let i = 0; i < 60; i++) {
      const a = vs[Math.floor(rnd() * vs.length)], t = vs[Math.floor(rnd() * vs.length)]; if (a === t) continue;
      const e = E.makeEdge(); e.source = a.id; e.target = t.id;
      const k = Math.floor(rnd() * 4); delete e.style.rounded;
      if (k === 0) e.style.edgeStyle = 'none'; else { e.style.edgeStyle = 'orthogonalEdgeStyle'; if (k === 2) e.style.rounded = '1'; if (k === 3) e.style.curved = '1'; }
      if (rnd() < 0.5) { const pts = E.getPoints(a); const p = pts[Math.floor(rnd() * pts.length)]; e.style.exitX = String(p[0]); e.style.exitY = String(p[1]); }
      if (rnd() < 0.5) { const pts = E.getPoints(t); const p = pts[Math.floor(rnd() * pts.length)]; e.style.entryX = String(p[0]); e.style.entryY = String(p[1]); }
      if (k === 0 && rnd() < 0.3) e.pts = [{ x: Math.round(rnd() * 1400), y: Math.round(rnd() * 900) }];
      P.cells.push(e);
    }
  });
  const P = E.page(), map = E.refreshMap();
  const xml = E.serializeDoc(E.S.doc); const m = xml.match(/<mxGraphModel[\s\S]*?<\/mxGraphModel>/)[0];
  const routes = {}, kinds = {}; for (const c of P.cells) if (c.e) { const r = E.edgeRoute(c, map); routes[c.id] = r.pts.map(p => [Math.round(p.x), Math.round(p.y)]); kinds[c.id] = r.kind + (c.style.exitX !== undefined ? ' fixS' : ' flS') + (c.style.entryX !== undefined ? ' fixT' : ' flT'); }
  return { m, routes, kinds };
});
const p2 = await b.newPage();
await p2.goto(new URL('mx.html', import.meta.url).href); await sleep(400);
const mx = await p2.evaluate((m) => window.renderXml(m), data.m);
let exact = 0, endOk = 0, total = 0; const byKind = {};
for (const id in data.routes) {
  const a = data.routes[id], m = mx.edgeInfo[id]; if (!m) continue; total++;
  const ok = JSON.stringify(a) === JSON.stringify(m);
  const ends = Math.hypot(a[0][0] - m[0][0], a[0][1] - m[0][1]) <= 2 && Math.hypot(a[a.length - 1][0] - m[m.length - 1][0], a[a.length - 1][1] - m[m.length - 1][1]) <= 2;
  if (ok) exact++; if (ends) endOk++;
  const k = data.kinds[id]; byKind[k] = byKind[k] || [0, 0, 0]; byKind[k][0]++; if (ok) byKind[k][1]++; if (ends) byKind[k][2]++;
  if (!ok && process.env.V) console.log(k, JSON.stringify(a), JSON.stringify(m));
}
console.log('random edges', total, 'identical', exact, 'same endpoints', endOk);
for (const k in byKind) console.log(k.padEnd(24), 'n=' + byKind[k][0], 'identical=' + byKind[k][1], 'endpoints=' + byKind[k][2]);
await b.close();
