import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const data = await pg.evaluate(() => {
  const E = DiagramEditor; let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  E.mutate(() => { const P = E.page(); const vs = [];
    for (let i = 0; i < 20; i++) { const c = E.makeVertex(['rect', 'ellipse', 'decision'][i % 3], Math.round(rnd() * 1000), Math.round(rnd() * 700)); P.cells.push(c); vs.push(c); }
    for (let i = 0; i < 40; i++) { const a = vs[Math.floor(rnd() * 20)], t = vs[Math.floor(rnd() * 20)]; const e = E.makeEdge(); e.source = a.id; e.target = t.id; e.style.jettySize = 'auto'; delete e.style.endSize; if (rnd() < .4) { const p = E.getPoints(a)[Math.floor(rnd() * 8)]; e.style.exitX = '' + p[0]; e.style.exitY = '' + p[1]; } P.cells.push(e); }
  });
  const P = E.page(), map = E.refreshMap(); const xml = E.serializeDoc(E.S.doc); const m = xml.match(/<mxGraphModel[\s\S]*?<\/mxGraphModel>/)[0];
  const routes = {}; for (const c of P.cells) if (c.e) routes[c.id] = E.edgeRoute(c, map).pts.map(p => [Math.round(p.x), Math.round(p.y)]);
  return { m, routes };
});
const p2 = await b.newPage(); await p2.goto(new URL('mx.html', import.meta.url).href); await sleep(300);
const mx = await p2.evaluate((m) => window.renderXml(m), data.m);
let same = 0, n = 0; for (const id in data.routes) { n++; if (JSON.stringify(data.routes[id]) === JSON.stringify(mx.edgeInfo[id])) same++; else if (process.env.V) console.log(JSON.stringify(data.routes[id]), JSON.stringify(mx.edgeInfo[id])); }
console.log('jettySize=auto incl. self loops: identical', same, 'of', n);
await b.close();
