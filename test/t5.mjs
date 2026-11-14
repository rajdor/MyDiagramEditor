import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
await pg.evaluate(() => { const E = DiagramEditor; E.mutate(() => { const a = E.makeVertex('rect', 100, 100), c = E.makeVertex('rect', 400, 100); const e = E.makeEdge(); e.source = a.id; e.target = c.id; E.page().cells.push(a, c, e); }); });
await sleep(300);
const mid = await pg.evaluate(() => { const vr = document.querySelector('#viewport').getBoundingClientRect(); const sp = DiagramEditor.toScreen({ x: 320, y: 130 }); return { x: vr.left + sp.x, y: vr.top + sp.y }; });
await pg.mouse.click(mid.x, mid.y, { count: 1 }); await pg.mouse.click(mid.x, mid.y, { count: 2 }); await sleep(200);
console.log('editing?', await pg.evaluate(() => JSON.stringify({ ed: !!DiagramEditor.S.editing, sel: DiagramEditor.S.sel, n: DiagramEditor.page().cells.length, act: document.activeElement.className })));
await pg.keyboard.type('yes'); await sleep(100);
console.log('ed html', await pg.evaluate(() => { const e = document.querySelector('.editorBox .ed'); return e ? e.innerHTML : 'none'; }));
console.log('TRACE', await pg.evaluate(() => (window.__trace||[]).join('\n'))); await pg.keyboard.down('Control'); await pg.keyboard.press('Enter'); await pg.keyboard.up('Control'); await sleep(150); // Ctrl+Enter keeps the text (Escape cancels)
console.log(await pg.evaluate(() => JSON.stringify(DiagramEditor.page().cells.filter(c => c.isEdgeLabel).map(c => [c.value, c.lx]))));
await pg.screenshot({ path: 'test/out/s_label.png' });
console.log(await (async()=>{const {b:_b}={b};return ''})()); console.log(errors.join('\n') || 'no errors');
await b.close();
