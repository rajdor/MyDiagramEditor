import { open } from './harness.mjs';
const { b, pg, errors } = await open({ h: 1100 });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const info = await pg.evaluate(() => {
  const E = DiagramEditor; const tiles = document.querySelectorAll('.ptile').length;
  E.mutate(() => {
    const P = E.page(); let x = 20, y = 20, i = 0;
    for (const t of Array.from(document.querySelectorAll('.ptile'))) {
      const key = t.title; // labels
    }
  });
  return tiles;
});
// insert every library shape via palette clicks, then arrange in grid
const n = await pg.$$eval('.ptile', ts => ts.length);
for (let i = 0; i < n; i++) { const ts = await pg.$$('.ptile'); await ts[i].click(); await sleep(30); }
await pg.evaluate(() => {
  const E = DiagramEditor; E.mutate(() => { const P = E.page(); let i = 0; for (const c of P.cells) { if (c.e) continue; c.x = 30 + (i % 8) * 190; c.y = 30 + Math.floor(i / 8) * 200; i++; } });
  const t = E.page().cells.find(c => c.style.shape === 'folder'); E.mutate(() => { t.value = 'A much longer tab title for testing'; });
  E.fitView();
});
await sleep(400);
const tab = await pg.evaluate(() => { const t = DiagramEditor.page().cells.find(c => c.style.shape === 'folder'); return [t.style.tabWidth, t.style.tabHeight, t.w]; });
// tab size depends on the fonts installed, so check the rule rather than the exact pixels
const grew = +tab[0] > 150 && +tab[0] < tab[2] && +tab[1] >= 20;
if (!grew) { console.log('FAIL: folder tab did not grow to fit the long title: ' + JSON.stringify(tab)); process.exitCode = 1; }
console.log('palette tiles', n, 'tab grew to fit long text, within the shape:', grew);
await pg.screenshot({ path: 'test/out/s_allshapes.png' });
console.log(errors.join('\n') || 'no errors');
await b.close();
