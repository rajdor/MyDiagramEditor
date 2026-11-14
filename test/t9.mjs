import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
await pg.evaluate(() => { const E = DiagramEditor; E.mutate(() => { const a = E.makeVertex('process', 160, 160), c = E.makeVertex('decision', 460, 140); c.value = 'OK?'; const e = E.makeEdge(); e.source = a.id; e.target = c.id; e.style.exitX = '1'; e.style.exitY = '0.5'; E.page().cells.push(a, c, e); const l = E.makeEdgeLabel(e, 'yes', 0, { x: 0, y: -12 }); E.page().cells.push(l); }); E.S.zoom = 1.5; E.S.tx = -50; E.S.ty = -50; });
await sleep(300);
const scr = (wx, wy) => pg.evaluate((wx, wy) => { const r = document.querySelector('#viewport').getBoundingClientRect(); const p = DiagramEditor.toScreen({ x: wx, y: wy }); return { x: r.left + p.x, y: r.top + p.y }; }, wx, wy);
// hover to show points
let p = await scr(220, 190); await pg.mouse.move(p.x, p.y); await sleep(200);
await pg.screenshot({ path: 'test/out/s_hover.png', clip: { x: 216, y: 98, width: 956, height: 500 } });
// select shape, see handles and format panel
await pg.mouse.click(p.x, p.y); await sleep(200);
await pg.screenshot({ path: 'test/out/s_selshape.png' });
// edit connection points
await pg.evaluate(() => { const btn = Array.from(document.querySelectorAll('#format .btn')).find(b => b.textContent === 'Edit points'); btn.click(); });
await sleep(200);
p = await scr(160 + 30, 160); // top edge at 0.25 -> drag along to 0.1
const q = await scr(160 + 12, 160);
await pg.mouse.move(p.x, p.y); await pg.mouse.down(); await pg.mouse.move(q.x, q.y, { steps: 5 }); await pg.mouse.up(); await sleep(100);
// click outline to add a point at bottom 0.6
const r = await scr(160 + 72, 220); await pg.mouse.click(r.x, r.y); await sleep(150);
console.log('points', await pg.evaluate(() => DiagramEditor.page().cells[0].style.points));
await pg.screenshot({ path: 'test/out/s_editpts.png', clip: { x: 216, y: 98, width: 956, height: 500 } });
// select edge
await pg.keyboard.press('Escape');
p = await scr(330, 190); await pg.mouse.click(p.x, p.y); await sleep(200); console.log('sel', await pg.evaluate(() => DiagramEditor.S.sel.map(id => !!DiagramEditor.cellById(id).e)));
await pg.screenshot({ path: 'test/out/s_seledge.png' });
console.log(errors.join('\n') || 'no errors');
await b.close();
