// de:render (docs/EMBED.md): the host asks for a picture of a diagram without opening it. The answer carries the same
// kind of SVG as Done; the editor's own diagram, its undo history and embed mode are untouched. Bad XML answers with an error.
// Also the sketch hatch colour: pale fills are deepened a little, less than before, and mid fills not at all.
import { open, ROOT } from './harness.mjs';
import { pathToFileURL } from 'url';
import path from 'path';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
await sleep(1200);
const hatch = await pg.evaluate(() => { const f = new Function('return typeof sketchHatch === "function" ? [sketchHatch("#F4DDD3", "#C2410C"), sketchHatch("#FFFFFF", "#000000"), sketchHatch("#3366CC", "#000000"), sketchHatch("none", "#000000")] : null'); return f(); });
if (hatch) {
  const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), far = (a, b) => Math.max(...rgb(a).map((v, i) => Math.abs(v - rgb(b)[i])));
  if (far(hatch[0], '#F4DDD3') > 20 || hatch[0].toUpperCase() === '#F4DDD3') fail('a pale fill should be hatched only a little deeper: ' + hatch[0]);
  if (far(hatch[1], '#FFFFFF') < 40) fail('white should be hatched clearly deeper: ' + hatch[1]);
  if (hatch[2].toUpperCase() !== '#3366CC' || hatch[3] !== 'none') fail('a mid fill and no fill are left as they are: ' + hatch.slice(2));
}
await pg.evaluate(() => { DiagramEditor.S.dirty = false; });
await pg.goto(pathToFileURL(path.join(ROOT, 'test', 'embed-host.html')).href);
await sleep(1800);
const frame = pg.frames().find(f => f.url().endsWith('diagram-editor.html'));
if (!frame) { fail('no editor frame'); await b.close(); process.exit(); }
const XML = '<mxfile><diagram name="Two boxes" id="p1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>' +
  '<mxCell id="a" value="Alpha" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#F4DDD3;strokeColor=#C2410C;sketch=1;fillStyle=hachure;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="144" height="64" as="geometry"/></mxCell>' +
  '<mxCell id="b" value="Beta" style="rounded=0;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="280" y="40" width="144" height="64" as="geometry"/></mxCell>' +
  '<mxCell id="e" value="" style="edgeStyle=none;html=1;" edge="1" parent="1" source="a" target="b"><mxGeometry relative="1" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>';
const state = () => frame.evaluate(() => ({ embed: !!DiagramEditor.S.embed, cells: DiagramEditor.S.doc.pages[0].cells.length, undo: DiagramEditor.S.undo.length, dirty: !!DiagramEditor.S.dirty }));
const before = await state();
await pg.evaluate((x) => { window.got.length = 0; window.sendInit({ type: 'de:render', xml: x, title: 'Rendered', id: 'r1' }); window.sendInit({ type: 'de:render', xml: '<nope', id: 'r2' }); window.sendInit({ type: 'de:render', xml: x, id: 7 }); }, XML);
await sleep(1200);
const got = await pg.evaluate(() => window.got.filter(m => m && m.type === 'de:rendered'));
const r1 = got.find(m => m.id === 'r1'), r2 = got.find(m => m.id === 'r2'), r3 = got.find(m => m.id === 7);
if (!r1 || !r2 || !r3) fail('expected three answers, each with its id: ' + JSON.stringify(got.map(m => m.id)));
else {
  if (!/^<svg[\s>]/.test(r1.svg) || !r1.svg.includes('Alpha') || !r1.svg.includes('Beta') || !/<title>Rendered<\/title>/.test(r1.svg)) fail('the picture should be an SVG holding the labels and the title');
  if (!(r1.width > 300 && r1.height > 60) || !/<mxfile/.test(r1.xml)) fail('the answer should carry the size and the diagram source: ' + r1.width + 'x' + r1.height);
  if (/@font-face/.test(r1.svg)) fail('no font should be embedded in the picture');
  if (!r2.error || r2.svg) fail('bad XML should answer with an error: ' + JSON.stringify(r2).slice(0, 200));
  const ids = (s) => [...s.matchAll(/ id="([^"]+)"/g)].map(m => m[1]);
  if (ids(r1.svg).some(i => ids(r3.svg).includes(i))) fail('two pictures share an id');
  if (!/<title>Two boxes<\/title>/.test(r3.svg)) fail('with no title the page name is used');
}
const after = await state();
if (JSON.stringify(before) !== JSON.stringify(after) || after.embed) fail('de:render changed the editor: ' + JSON.stringify([before, after]));
await frame.evaluate(() => window.postMessage({ type: 'de:render', xml: '<mxfile/>', id: 'x' }, '*')); await sleep(300);
if ((await pg.evaluate(() => window.got.filter(m => m && m.id === 'x'))).length) fail('answered a de:render that did not come from the parent');
if (errors.length) fail('page errors: ' + errors.join(' | '));
console.log(process.exitCode ? 'Render checks FAILED' : 'Render checks passed');
await b.close();
