import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const r = await pg.evaluate(() => {
  const E = DiagramEditor; const out = [];
  E.S.zoom = 1; E.S.tx = 0; E.S.ty = 0;
  E.mutate(() => { const a = E.makeVertex('process', 200, 200); E.page().cells.push(a); E.S.sel = [a.id]; });
  E.runCommand('copy'); E.runCommand('paste');
  let c = E.page().cells[E.page().cells.length - 1]; out.push('paste 1: ' + c.x + ',' + c.y);
  E.runCommand('paste'); c = E.page().cells[E.page().cells.length - 1]; out.push('paste 2: ' + c.x + ',' + c.y);
  E.setSel([E.page().cells[0].id]); E.runCommand('duplicate'); c = E.page().cells[E.page().cells.length - 1]; out.push('duplicate: ' + c.x + ',' + c.y);
  // shape near the bottom-right edge of the visible area
  const vr = document.querySelector('#viewport').getBoundingClientRect();
  E.mutate(() => { const z = E.makeVertex('process', vr.width - 125, vr.height - 65); E.page().cells.push(z); E.S.sel = [z.id]; });
  E.runCommand('copy'); E.runCommand('paste'); c = E.page().cells[E.page().cells.length - 1]; out.push('near edge (' + Math.round(vr.width - 125) + ',' + Math.round(vr.height - 65) + ') pasted at: ' + Math.round(c.x) + ',' + Math.round(c.y));
  return out;
});
console.log(r.join('\n')); console.log(errors.join('\n') || 'no errors');
await b.close();
