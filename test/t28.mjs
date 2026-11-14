// Palette: groups expand and collapse (including nested Collections > Phosphor > themes), Alt+click isolates a group,
// state survives a reload, search finds shapes and icons, and clicking a tile inserts it.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
await sleep(800);
const top = () => pg.evaluate(() => [...document.querySelectorAll('#palette .ptree > .pgroup')].map(s => ({ g: s.dataset.group, open: !s.classList.contains('collapsed'), aria: s.querySelector(':scope > .pghead').getAttribute('aria-expanded') })));
const isOpen = (key) => pg.evaluate((k) => { const s = document.querySelector('#palette .pgroup[data-group="' + k + '"]'); return s ? !s.classList.contains('collapsed') : null; }, key);

let s = await top();
if (!s.find(x => x.g === 'Basic') || !s.find(x => x.g === 'Collections')) fail('expected shape groups and Collections');
if (!s.every(x => x.open && x.aria === 'true')) fail('top-level groups not open by default');

await pg.click('#palette .pgroup[data-group="Flow"] > .pghead'); await sleep(100);
if (await isOpen('Flow')) fail('Flow did not collapse');
await pg.reload(); await sleep(900);
if (await isOpen('Flow')) fail('collapsed state not remembered after reload');

await pg.keyboard.down('Alt'); await pg.click('#palette .pgroup[data-group="Basic"] > .pghead'); await pg.keyboard.up('Alt'); await sleep(100);
s = await top();
if (!s.every(x => x.open === (x.g === 'Basic'))) fail('Alt+click did not isolate Basic');

// Collections > Phosphor > themes
await pg.click('#palette .pgroup[data-group="Collections"] > .pghead'); await sleep(200);
if (!(await isOpen('Collections/Phosphor'))) fail('Phosphor not open inside Collections');
const themes = await pg.evaluate(() => [...document.querySelectorAll('#palette .pgroup.lvl2')].map(t => [t.dataset.group, +t.querySelector('.pgcount').textContent, t.classList.contains('collapsed')]));
if (themes.length !== 18) fail('expected 18 Phosphor themes, got ' + themes.length);
if (themes.reduce((a, t) => a + t[1], 0) !== 1512) fail('theme counts do not add up to 1512');
if (!themes.every(t => t[2])) fail('themes should start collapsed');
await pg.click('#palette .pgroup[data-group="Collections/Phosphor/System & devices"] > .pghead'); await sleep(300);
const tiles = await pg.evaluate(() => document.querySelectorAll('#palette .pgroup[data-group="Collections/Phosphor/System & devices"] .ptile').length);
if (tiles !== themes.find(t => t[0].endsWith('System & devices'))[1]) fail('theme rendered ' + tiles + ' tiles');

// clicking an icon inserts an icon cell
const before = await pg.evaluate(() => DiagramEditor.page().cells.length);
await pg.click('#palette .pgroup[data-group="Collections/Phosphor/System & devices"] .ptile'); await sleep(200);
const ins = await pg.evaluate(() => { const c = DiagramEditor.page().cells.at(-1); return { n: DiagramEditor.page().cells.length, ph: c.style.dePh, shape: c.style.shape || null }; });
if (ins.n !== before + 1 || !ins.ph) fail('icon click did not insert an icon');
if (ins.shape) fail('icon should not hold a stencil in memory');

// keyboard: headers are buttons
await pg.focus('#palette .pgroup[data-group="Notes"] > .pghead'); await pg.keyboard.press('Enter'); await sleep(100);
if (!(await isOpen('Notes'))) fail('Enter did not expand Notes');

// Expand all / Collapse all
await pg.click('#palette .pbar button[data-act="collapse"]'); await sleep(100);
if ((await top()).some(x => x.open)) fail('Collapse all failed');
await pg.click('#palette .pbar button[data-act="expand"]'); await sleep(600);
if (!(await top()).every(x => x.open)) fail('Expand all failed');

// search
await pg.type('#palette .psearch', 'database'); await sleep(300);
const res = await pg.evaluate(() => ({ tree: document.querySelector('#palette .ptree').hidden, heads: [...document.querySelectorAll('#palette .pres-h')].map(h => h.textContent), icons: document.querySelectorAll('#palette .presults .ptiles.icons .ptile').length }));
if (!res.tree || res.icons < 3 || !res.heads.some(h => h.startsWith('Shapes'))) fail('search results wrong: ' + JSON.stringify(res));
await pg.click('#palette .psearch', { count: 3 }); await pg.keyboard.press('Backspace'); await sleep(200);
if (await pg.evaluate(() => document.querySelector('#palette .ptree').hidden)) fail('clearing search did not restore the tree');

await pg.click('#palette .pbar button[data-act="collapse"]'); await sleep(100);
await pg.click('#palette .pgroup[data-group="Basic"] > .pghead'); await sleep(100);
await pg.screenshot({ path: 'test/out/s_palette.png', clip: { x: 0, y: 0, width: 260, height: 700 } });
console.log(errors.join('\n') || 'no errors');
console.log(process.exitCode ? 'palette test FAILED' : 'palette test passed');
await b.close();
