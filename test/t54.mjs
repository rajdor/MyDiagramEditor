// Embed notice: de:init may carry a notice (the host converted the diagram); it shows in a bar above the canvas,
// as plain text, until dismissed or the next de:init, and the canvas keeps the space below it.
import { open, ROOT } from './harness.mjs';
import { pathToFileURL } from 'url';
import path from 'path';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
await sleep(800);
// standalone: no bar
if (await pg.evaluate(() => !document.querySelector('#embedNotice').hidden)) fail('notice bar shows in the standalone editor');

await pg.goto(pathToFileURL(path.join(ROOT, 'test', 'embed-host.html')).href);
await sleep(1800);
const frame = pg.frames().find(f => f.url().endsWith('diagram-editor.html'));
if (!frame) { fail('no editor frame'); await b.close(); process.exit(); }
const xml = '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="a" value="Box" style="rounded=0;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="120" height="60" as="geometry"/></mxCell></root></mxGraphModel>';
const state = () => frame.evaluate(() => { const n = document.querySelector('#embedNotice'), v = document.querySelector('#viewport').getBoundingClientRect(), s = n.getBoundingClientRect();
  return { hidden: n.hidden, text: n.querySelector('span').textContent, html: n.querySelector('span').innerHTML, nTop: s.top, nBottom: s.bottom, vTop: v.top }; });

// 1. a notice: shown, as text, above the canvas without covering it
const note = 'Converted from a picture. Layout may differ. <b>not bold</b>';
await pg.evaluate(([x, t]) => window.sendInit({ type: 'de:init', xml: x, title: 'T', mode: 'blueprint', notice: t }), [xml, note]);
await sleep(900);
let s = await state();
if (s.hidden || s.text !== note) fail('notice not shown as given: ' + JSON.stringify(s));
if (!s.html.includes("&lt;b&gt;")) fail('notice text was read as HTML: ' + s.html);
if (s.vTop < s.nBottom - 1) fail('notice covers the canvas: ' + JSON.stringify(s));
if (await frame.evaluate(() => DiagramEditor.page().cells.length !== 1)) fail('diagram not loaded with a notice');

// 2. dismiss
await frame.click('#embedNotice button'); await sleep(200);
s = await state(); if (!s.hidden) fail('notice not dismissed');

// 3. the next de:init without a notice: no bar; with one, the bar again
await pg.evaluate((x) => window.sendInit({ type: 'de:init', xml: x, title: 'T', mode: 'blueprint', notice: 'Again' }), xml); await sleep(700);
s = await state(); if (s.hidden || s.text !== 'Again') fail('second notice not shown');
await pg.evaluate((x) => window.sendInit({ type: 'de:init', xml: x, title: 'T', mode: 'blueprint' }), xml); await sleep(700);
s = await state(); if (!s.hidden) fail('notice left over from the previous diagram');
// not text: ignored
await pg.evaluate((x) => window.sendInit({ type: 'de:init', xml: x, title: 'T', mode: 'blueprint', notice: { a: 1 } }), xml); await sleep(700);
s = await state(); if (!s.hidden) fail('a notice that is not text was shown');

if (errors.length) fail('console errors: ' + errors.join(' | '));
if (!process.exitCode) console.log('PASS t54 embed notice');
await b.close();
