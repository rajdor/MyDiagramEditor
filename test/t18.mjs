import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
await pg.evaluate(() => DiagramEditor.runCommand('crowsFoot')); await sleep(300);
await pg.screenshot({ path: 'test/out/s_crow.png' });
await pg.evaluate(() => document.querySelector('.modalBack').remove());
await pg.click('#menus button:nth-child(4)'); await sleep(200);
await pg.screenshot({ path: 'test/out/s_menu.png', clip: { x: 0, y: 0, width: 700, height: 520 } });
await pg.keyboard.press('Escape');
// sketch page export
await pg.evaluate(() => DiagramEditor.runCommand('testDiagram')); await sleep(400);
await pg.click('#tabs .tab:nth-child(2)'); await sleep(300);
const png = await pg.evaluate(async () => { const E = DiagramEditor; const ex = E.buildExportSvg(E.page(), { bg: true }); const { canvas } = await E.renderToCanvas(ex, 1); return canvas.toDataURL('image/png'); });
const fs = await import('fs'); fs.writeFileSync('test/out/sketch_export.png', Buffer.from(png.split(',')[1], 'base64'));
console.log(errors.join('\n') || 'no errors');
await b.close();
