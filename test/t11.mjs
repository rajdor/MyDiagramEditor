import { launch } from './harness.mjs';
const b = await launch();
const p2 = await b.newPage();
await p2.goto(new URL('mx.html', import.meta.url).href); await new Promise(r => setTimeout(r, 400));
const res = await p2.evaluate(() => {
  const out = [];
  for (let dx = -360; dx <= 360; dx += 40) for (let dy = -300; dy <= 300; dy += 40) {
    const container = document.createElement('div'); document.body.appendChild(container);
    const graph = new mxGraph(container); const parent = graph.getDefaultParent();
    graph.getModel().beginUpdate();
    const a = graph.insertVertex(parent, null, '', 400, 400, 100, 60);
    const t = graph.insertVertex(parent, null, '', 400 + dx, 400 + dy, 100, 60);
    const e = graph.insertEdge(parent, null, '', a, t, 'edgeStyle=orthogonalEdgeStyle;');
    graph.getModel().endUpdate();
    const st = graph.view.getState(e);
    const pts = st.absolutePoints.map(p => [Math.round(p.x), Math.round(p.y)]);
    const side = (p, x, y, w, h) => p[0] <= x + 0.5 ? 'L' : p[0] >= x + w - 0.5 ? 'R' : p[1] <= y + 0.5 ? 'T' : p[1] >= y + h - 0.5 ? 'B' : '?';
    out.push([dx, dy, side(pts[0], 400, 400, 100, 60), side(pts[pts.length - 1], 400 + dx, 400 + dy, 100, 60), pts.length]);
    container.remove();
  }
  return out;
});
// print grid of source exit sides
const dys = [...new Set(res.map(r => r[1]))], dxs = [...new Set(res.map(r => r[0]))];
console.log('source exit side (rows dy, cols dx)\n      ' + dxs.map(d => String(d).padStart(5)).join(''));
for (const dy of dys) console.log(String(dy).padStart(5) + ' ' + dxs.map(dx => { const r = res.find(x => x[0] === dx && x[1] === dy); return (r[2] + r[3]).padStart(5); }).join(''));
await b.close();
