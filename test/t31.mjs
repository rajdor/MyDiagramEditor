// Right mouse button: hold and drag pans the canvas (no menu); a right-click without dragging opens the context menu.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
await sleep(800);
await pg.evaluate(() => { const E = DiagramEditor; E.mutate(() => { E.page().cells.push(E.makeVertex('process', 100, 100, 'outline')); }); });
const r = await pg.evaluate(() => { const v = document.querySelector('#viewport').getBoundingClientRect(); return { x: v.left + v.width / 2, y: v.top + v.height / 2 }; });
const view = () => pg.evaluate(() => ({ tx: DiagramEditor.S.tx, ty: DiagramEditor.S.ty, menu: !!document.querySelector('#menuPopup .popup'), sel: DiagramEditor.S.sel.length, cells: DiagramEditor.page().cells.length }));

// right-drag pans
let v0 = await view();
await pg.mouse.move(r.x, r.y); await pg.mouse.down({ button: 'right' });
await pg.mouse.move(r.x + 60, r.y + 40, { steps: 6 }); await pg.mouse.move(r.x + 120, r.y + 80, { steps: 6 });
await pg.mouse.up({ button: 'right' }); await sleep(700);
let v1 = await view();
if (Math.abs(v1.tx - v0.tx - 120) > 2 || Math.abs(v1.ty - v0.ty - 80) > 2) fail('right-drag did not pan by the mouse movement: ' + JSON.stringify([v0, v1]));
if (v1.menu) fail('context menu opened after a right-drag');
if (v1.cells !== v0.cells) fail('right-drag changed the diagram');

// right-click without moving opens the menu
await pg.mouse.click(r.x, r.y, { button: 'right' }); await sleep(300);
let v2 = await view();
if (!v2.menu) fail('right-click did not open the context menu');
if (Math.abs(v2.tx - v1.tx) > 0.5) fail('right-click moved the canvas');
await pg.keyboard.press('Escape'); await pg.mouse.click(r.x + 300, r.y + 200); await sleep(200);

// a small wobble (under 4 px) still counts as a click
await pg.mouse.move(r.x, r.y); await pg.mouse.down({ button: 'right' }); await pg.mouse.move(r.x + 2, r.y + 1); await pg.mouse.up({ button: 'right' }); await sleep(300);
if (!(await view()).menu) fail('right-click with a tiny wobble did not open the menu');
// Windows sends the contextmenu event after the button is released: it must not open a second menu after a drag
await pg.keyboard.press('Escape'); await pg.mouse.click(r.x + 300, r.y + 200); await sleep(200);
await pg.mouse.move(r.x, r.y); await pg.mouse.down({ button: 'right' }); await pg.mouse.move(r.x + 80, r.y, { steps: 6 }); await pg.mouse.up({ button: 'right' });
await pg.evaluate((x, y) => document.querySelector('#svg').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y })), r.x + 80, r.y); await sleep(300);
if ((await view()).menu) fail('a late contextmenu event (Windows order) opened the menu after a drag');
// the keyboard menu key (no mouse) still opens it
await sleep(700);
await pg.evaluate((x, y) => document.querySelector('#svg').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y })), r.x, r.y); await sleep(300);
if (!(await view()).menu) fail('keyboard context menu did not open');
// Windows sends the contextmenu event after the button is released: it must not open a menu after a drag
await pg.keyboard.press('Escape'); await pg.mouse.click(r.x + 300, r.y + 200); await sleep(200);
await pg.mouse.move(r.x, r.y); await pg.mouse.down({ button: 'right' }); await pg.mouse.move(r.x + 80, r.y, { steps: 6 }); await pg.mouse.up({ button: 'right' });
await pg.evaluate((x, y) => document.querySelector('#svg').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y })), r.x + 80, r.y); await sleep(300);
if ((await view()).menu) fail('a late contextmenu event (Windows order) opened the menu after a drag');
// the keyboard menu key (no mouse) still opens it
await sleep(700);
await pg.evaluate((x, y) => document.querySelector('#svg').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y })), r.x, r.y); await sleep(300);
if (!(await view()).menu) fail('keyboard context menu did not open');
console.log(errors.join('\n') || 'no errors');
console.log(process.exitCode ? 'right-drag test FAILED' : 'right-drag test passed');
await b.close();
