import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const tiles = await pg.$$('.ptile');
await tiles[4].click(); await sleep(200);
const c = await pg.evaluate(() => { const c = DiagramEditor.page().cells[0]; const r = document.querySelector('#viewport').getBoundingClientRect(); const p = DiagramEditor.toScreen({ x: c.x + c.w / 2, y: c.y + c.h / 2 }); return { x: r.left + p.x, y: r.top + p.y }; });
await pg.mouse.click(c.x, c.y, { count: 2 }); await sleep(150);
console.log('active', await pg.evaluate(() => document.activeElement.className));
for (const ch of 'Hello') { await pg.keyboard.type(ch); console.log(ch, await pg.evaluate(() => { const e = document.querySelector('.editorBox .ed'); return e ? e.innerHTML + ' | active=' + document.activeElement.className : 'no editor'; })); }
console.log(errors.join('\n') || 'no errors');
await b.close();
