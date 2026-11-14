import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
await pg.evaluate(() => DiagramEditor.runCommand('testDiagram')); await sleep(500);
const data = await pg.evaluate(() => {
  const E = DiagramEditor, P = E.page(), map = E.refreshMap();
  const xml = E.serializeDoc(E.S.doc);
  const m = xml.match(/<mxGraphModel[\s\S]*?<\/mxGraphModel>/)[0];
  const routes = {}; for (const c of P.cells) if (c.e) routes[c.id] = E.edgeRoute(c, map).pts.map(p => [Math.round(p.x), Math.round(p.y)]);
  const v = P.cells.filter(c => !c.e).length, e = P.cells.filter(c => c.e).length;
  return { m, routes, v, e };
});
const p2 = await b.newPage();
p2.on('pageerror', e => console.log('MXERR', e.message));
await p2.goto(new URL('mx.html', import.meta.url).href); await sleep(500);
const mx = await p2.evaluate((m) => window.renderXml(m), data.m);
console.log('ours: vertices+labels', data.v, 'edges', data.e, '| mxGraph: vertices', mx.vertices, 'edges', mx.edges, 'problems', mx.problems.length);
let exact = 0, endOk = 0, total = 0; const bad = [];
for (const id in data.routes) {
  const a = data.routes[id], m = mx.edgeInfo[id]; if (!m) continue; total++;
  const d0 = Math.hypot(a[0][0] - m[0][0], a[0][1] - m[0][1]), d1 = Math.hypot(a[a.length - 1][0] - m[m.length - 1][0], a[a.length - 1][1] - m[m.length - 1][1]);
  if (d0 <= 2 && d1 <= 2) endOk++;
  if (JSON.stringify(a) === JSON.stringify(m)) exact++; else bad.push({ id, ours: a, mx: m });
}
console.log('edges compared', total, 'endpoints within 2px', endOk, 'identical routes', exact);
for (const x of bad.slice(0, 12)) console.log(JSON.stringify(x));
await p2.screenshot({ path: 'test/out/s_mx.png' });
console.log(errors.join('\n') || 'no errors');
await b.close();
