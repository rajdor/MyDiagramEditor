import path from 'path';
import { launch } from './harness.mjs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { stencilXml } = require(path.resolve('src/shapes.js'));
const b = await launch();
const p = await b.newPage(); await p.setViewport({ width: 500, height: 260 });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(new URL('mx.html', import.meta.url).href); await new Promise(r => setTimeout(r, 300));
await p.evaluate((xmls) => {
  for (const [name, xml] of xmls) { const node = mxUtils.parseXml(xml).documentElement; mxStencilRegistry.addStencil('de' + name, new mxStencil(node)); }
  const g = new mxGraph(document.getElementById('g')); const P = g.getDefaultParent();
  g.getModel().beginUpdate();
  g.insertVertex(P, null, '', 40, 40, 100, 120, 'shape=deperson;fillColor=#f8fafc;strokeColor=#475569;strokeWidth=1.5;');
  g.insertVertex(P, null, '', 200, 40, 160, 120, 'shape=depeople;fillColor=#dbeafe;strokeColor=#3b82f6;strokeWidth=1.5;');
  g.getModel().endUpdate();
}, [['person', stencilXml('person')], ['people', stencilXml('people')]]);
await new Promise(r => setTimeout(r, 300));
await p.screenshot({ path: 'test/out/s_stencil_mx.png' });
console.log(errs.join('\n') || 'stencils parsed and drawn by mxGraph');
await b.close();
