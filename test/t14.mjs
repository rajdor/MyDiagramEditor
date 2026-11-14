// Performance: routing and a full redraw of 250 shapes and 250 lines stay within a time budget.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const r = await pg.evaluate(async () => {
  const E = DiagramEditor; let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  E.mutate(() => { const P = E.page(); const vs = [];
    for (let i = 0; i < 250; i++) { const c = E.makeVertex(['process', 'decision', 'rect', 'ellipse'][i % 4], (i % 20) * 160, Math.floor(i / 20) * 120); c.value = 'Shape ' + i; P.cells.push(c); vs.push(c); }
    for (let i = 0; i < 250; i++) { const e = E.makeEdge(); e.source = vs[i].id; e.target = vs[(i + 1 + Math.floor(rnd() * 30)) % 250].id; if (i % 3 === 0) e.style.jumpStyle = 'arc'; P.cells.push(e); }
  });
  E.fitView(); E.renderAll();
  const c = E.page().cells[0];
  let t0 = performance.now(); for (let k = 0; k < 10; k++) E.computeRoutes(E.page(), E.refreshMap()); const routes = (performance.now() - t0) / 10;
  t0 = performance.now(); for (let k = 0; k < 10; k++) { c.x += 5; E.renderAll(); } const full = (performance.now() - t0) / 10;
  return { routesMs: routes.toFixed(1), renderAllMs: full.toFixed(1) };
});
// Budget: generous, so a slow laptop passes, but a big regression (e.g. 10x slower routing) fails.
const BUDGET = { routesMs: 150, renderAllMs: 300 };
if (+r.routesMs > BUDGET.routesMs || +r.renderAllMs > BUDGET.renderAllMs) { console.log('FAIL: too slow for 250 shapes and 250 lines: ' + JSON.stringify(r) + ' budget ' + JSON.stringify(BUDGET)); process.exitCode = 1; }
else console.log('250 shapes and 250 lines: routing and full render within budget ' + JSON.stringify(BUDGET));
if (process.env.SHOW_TIMINGS) console.log(r);
await b.close();
