import { open } from './harness.mjs';
const { b, pg } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
await pg.evaluate(() => { const E = DiagramEditor; E.mutate(() => { const P = E.page(); const a = E.makeVertex('rect', 40, 60); a.w = 40; a.h = 28; a.value = 'tiny'; const c = E.makeVertex('process', 160, 40); c.w = 360; c.h = 160; P.cells.push(a, c); }); E.S.zoom = 1; E.S.tx = 0; E.S.ty = 0; });
await sleep(200);
const at = async (x, y) => { const r = await pg.evaluate((x, y) => { const v = document.querySelector('#viewport').getBoundingClientRect(); return { x: v.left + x, y: v.top + y }; }, x, y); await pg.mouse.move(r.x - 5, r.y - 5); await pg.mouse.move(r.x, r.y, { steps: 2 }); await sleep(150); };
await at(60, 74); await pg.screenshot({ path: 'test/out/s_pts_small.png', clip: { x: 216, y: 98, width: 560, height: 230 } });
await at(300, 120); await sleep(300); console.log(await pg.evaluate(() => JSON.stringify({ h: DiagramEditor.S.hover, n: DiagramEditor.S.hover && DiagramEditor.offeredPoints(DiagramEditor.cellById(DiagramEditor.S.hover)).length, ov: document.querySelector('#overlay').childNodes.length }))); await pg.screenshot({ path: 'test/out/s_pts_big.png', clip: { x: 216, y: 98, width: 560, height: 230 } });
await b.close();
