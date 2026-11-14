import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
await pg.evaluate(() => {
  const E = DiagramEditor;
  E.mutate(() => {
    const P = E.page();
    const a = E.makeVertex('tabbed', 40, 40); P.cells.push(a);
    const b = E.makeVertex('tabbed', 340, 40); P.cells.push(b); b.value = 'Customer onboarding services';
    const c = E.makeVertex('process', 70, 110); P.cells.push(c);
    const d = E.makeVertex('arrow', 640, 60); P.cells.push(d);
    const e2 = E.makeVertex('cloud', 640, 160); P.cells.push(e2);
  });
  E.S.zoom = 1.3; E.S.tx = 0; E.S.ty = 0; E.setSel([]);
});
await sleep(300);
await pg.screenshot({ path: 'test/out/s_tabbed.png', clip: { x: 216, y: 98, width: 956, height: 420 } });
// tab sizes depend on the fonts installed, so check the rule rather than the exact pixels
const tabs = await pg.evaluate(() => DiagramEditor.page().cells.filter(c => c.style.shape === 'folder').map(c => [+c.style.tabWidth, +c.style.tabHeight, c.w]));
const ok = tabs.length === 2 && tabs[1][0] > tabs[0][0] && tabs.every(t => t[0] > 40 && t[0] <= t[2] && t[1] >= 20);
if (!ok) { console.log('FAIL: tab sizes do not fit their labels: ' + JSON.stringify(tabs)); process.exitCode = 1; }
console.log('tabs fit their labels (longer label, wider tab):', ok);
console.log(errors.join('\n') || 'no errors');
await b.close();
