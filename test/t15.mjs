import { open } from './harness.mjs';
import fs from 'fs';
const { b, pg, errors } = await open();
const txt = fs.readFileSync('test/files/compressed.drawio', 'utf8');
const r = await pg.evaluate(async (t) => {
  const E = DiagramEditor; await E.loadText(t, 'compressed.drawio');
  const out = E.serializeDoc(E.S.doc);
  return { pages: E.S.doc.pages.map(p => p.name + ':' + p.cells.length + ' layers ' + p.layers.length), out };
}, txt);
console.log(r.pages);
const page1 = r.out.split('</diagram>')[0];
console.log(page1);
await new Promise(r => setTimeout(r, 400));
await pg.screenshot({ path: 'test/out/s_import.png', clip: { x: 216, y: 98, width: 956, height: 500 } });
console.log(errors.join('\n') || 'no errors');
await b.close();
