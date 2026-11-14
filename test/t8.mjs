import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = console.log;
// build a small flow with crossings
await pg.evaluate(() => {
  const E = DiagramEditor;
  E.mutate(() => {
    const P = E.page(); const mk = (k, x, y, v) => { const c = E.makeVertex(k, x, y); c.value = v; P.cells.push(c); return c; };
    const a = mk('terminator', 100, 300, 'Start'), b = mk('process', 500, 100, 'B'), c = mk('process', 100, 100, 'C'), d = mk('decision', 500, 300, 'D?'), e = mk('process', 300, 500, 'E'), n = mk('sticky', 700, 120, 'note about B');
    const L = (s, t) => { const x = E.makeEdge(); x.source = s.id; x.target = t.id; P.cells.push(x); return x; };
    L(a, b); L(c, d); L(a, e); L(b, d); L(c, e); L(d, e);
  });
});
await sleep(300);
log('crossings initially', await pg.evaluate(() => DiagramEditor.countAllCrossings()));
const r1 = await pg.evaluate(() => { let r; DiagramEditor.mutate(() => { r = DiagramEditor.minimiseCrossings(DiagramEditor.page().cells.filter(c => c.e)); }); return r; });
log('lines only', JSON.stringify(r1));
await sleep(200); await pg.screenshot({ path: 'test/out/s_lines_min.png' });
await pg.evaluate(() => DiagramEditor.runCommand('arrangeAll')); await sleep(600);
log('layered dialog:', await pg.evaluate(() => document.querySelector('#lyRes').textContent));
await pg.evaluate(() => { document.querySelector('#lyDir').value = 'LR'; document.querySelector('#lyDir').dispatchEvent(new Event('input')); }); await sleep(400);
log('layered LR:', await pg.evaluate(() => document.querySelector('#lyRes').textContent));
await pg.evaluate(() => { const bs = Array.from(document.querySelectorAll('.modal footer .btn')); bs[bs.length - 1].click(); }); await sleep(300);
await pg.evaluate(() => DiagramEditor.runCommand('fit')); await sleep(300);
await pg.screenshot({ path: 'test/out/s_layered.png' });
// shape layouts
for (const type of ['grid', 'circle', 'pyramid', 'rows']) {
  await pg.evaluate(() => DiagramEditor.runCommand('arrangeShapes')); await sleep(300);
  await pg.evaluate((t) => { const s = document.querySelector('#alType'); s.value = t; s.dispatchEvent(new Event('change')); }, type); await sleep(200);
  await pg.evaluate(() => DiagramEditor.runCommand('fit')); await sleep(300);
  await pg.screenshot({ path: 'test/out/s_layout_' + type + '.png' });
  await pg.evaluate(() => { const bs = Array.from(document.querySelectorAll('.modal footer .btn')); bs[0].click(); }); await sleep(200);
}
// guides from ruler
const rt = await pg.$('#rulerTop'); const bb = await rt.boundingBox();
await pg.mouse.move(bb.x + 300, bb.y + 10); await pg.mouse.down(); await pg.mouse.move(bb.x + 300, bb.y + 200, { steps: 6 }); await pg.mouse.up(); await sleep(200);
log('guides', await pg.evaluate(() => JSON.stringify(DiagramEditor.page().guides)));
// group, rotate group via API mutation, ungroup
await pg.evaluate(() => { const E = DiagramEditor; const ids = E.page().cells.filter(c => !c.e && !c.isEdgeLabel).slice(0, 2).map(c => c.id); E.setSel(ids); E.runCommand('group'); });
log('after group sel', await pg.evaluate(() => { const c = DiagramEditor.cellById(DiagramEditor.S.sel[0]); return c.style.group !== undefined ? 'group ' + Math.round(c.w) + 'x' + Math.round(c.h) : 'not group'; }));
await pg.evaluate(() => DiagramEditor.runCommand('copy')); await pg.evaluate(() => DiagramEditor.runCommand('paste'));
log('cells after paste', await pg.evaluate(() => DiagramEditor.page().cells.length));
await pg.evaluate(() => DiagramEditor.runCommand('ungroup'));
log('after ungroup sel', await pg.evaluate(() => DiagramEditor.S.sel.length));
const xml = await pg.evaluate(() => DiagramEditor.serializeDoc(DiagramEditor.S.doc));
log('xml has deGuides:', xml.includes('deGuides'), 'group:', (xml.match(/style="group;"/g) || []).length);
const rt2 = await pg.evaluate(async (x) => { const d = await DiagramEditor.parseDrawio(x); return DiagramEditor.serializeDoc(d) === x; }, xml);
log('round trip with groups and guides:', rt2);
log(errors.join('\n') || 'no errors');
await b.close();
