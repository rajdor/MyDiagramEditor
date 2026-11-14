import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const r = await pg.evaluate(() => {
  const E = DiagramEditor; const rows = [];
  for (const [key, w, h] of [['rect', 20, 14], ['rect', 40, 30], ['rect', 120, 60], ['rect', 300, 200], ['ellipse', 20, 20], ['ellipse', 80, 80], ['ellipse', 300, 300], ['decision', 50, 40], ['decision', 120, 80], ['decision', 400, 300]])
    for (const z of [0.5, 1, 2]) { const c = E.makeVertex(key, 0, 0); c.w = w; c.h = h; E.S.zoom = z; rows.push(key + ' ' + w + 'x' + h + ' @' + z + ': ' + E.offeredPoints(c).length); }
  E.S.zoom = 1; return rows;
});
console.log(r.join('\n'));
// small shape: can it be moved by dragging near its edge?
await pg.evaluate(() => { const E = DiagramEditor; E.mutate(() => { const c = E.makeVertex('rect', 200, 200); c.w = 30; c.h = 20; E.page().cells.push(c); }); E.S.zoom = 1; E.S.tx = 0; E.S.ty = 0; });
await sleep(200);
const p = await pg.evaluate(() => { const r = document.querySelector('#viewport').getBoundingClientRect(); return { x: r.left + 222, y: r.top + 210 }; });
await pg.mouse.move(p.x - 30, p.y); await pg.mouse.move(p.x, p.y, { steps: 3 }); await pg.mouse.down(); await pg.mouse.move(p.x + 100, p.y + 50, { steps: 6 }); await pg.mouse.up(); await sleep(100);
console.log('small shape after drag:', await pg.evaluate(() => { const c = DiagramEditor.page().cells[0]; return [c.x, c.y, DiagramEditor.page().cells.length]; }));
console.log(errors.join('\n') || 'no errors');
await b.close();
