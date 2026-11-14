// Robustness: damaged, unusual and hostile draw.io files open without errors or hangs, and every editing,
// style and export path keeps working on them. Each case: open, render, select all, move, undo, redo,
// copy and paste, every style switch, SVG/PNG/Gliffy export, save, and reopen the saved file.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
await sleep(900);

const W = (cells, extra = '') => `<mxfile><diagram name="P" id="p"><mxGraphModel${extra}><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells}</root></mxGraphModel></diagram></mxfile>`;
const V = (id, parent = '1', x = 10, y = 10, w = 80, h = 40, st = '') => `<mxCell id="${id}" value="${id}" style="${st}" vertex="1" parent="${parent}"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`;
const E = (id, s, t, parent = '1', pts = '') => `<mxCell id="${id}" style="edgeStyle=orthogonalEdgeStyle;" edge="1" parent="${parent}" source="${s}" target="${t}"><mxGeometry relative="1" as="geometry">${pts}</mxGeometry></mxCell>`;
const many = (n) => { let s = ''; for (let i = 0; i < n; i++) s += V('n' + i, '1', (i % 40) * 100, Math.floor(i / 40) * 60); for (let i = 1; i < n; i++) s += E('m' + i, 'n' + (i - 1), 'n' + i); return s; };
const cases = {
  'empty mxfile': '<mxfile></mxfile>',
  'bare mxGraphModel': '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>' + V('a') + '</root></mxGraphModel>',
  'no root element': '<mxfile><diagram name="x" id="x"><mxGraphModel></mxGraphModel></diagram></mxfile>',
  'no layer': '<mxfile><diagram name="x" id="x"><mxGraphModel><root><mxCell id="0"/>' + V('a', '0') + '</root></mxGraphModel></diagram></mxfile>',
  'parent cycle': W(V('a', 'b') + V('b', 'a') + V('c', 'c') + E('e', 'a', 'b')),
  'long parent chain': W(Array.from({ length: 300 }, (_, i) => V('g' + i, i ? 'g' + (i - 1) : '1', 1, 1, 50, 50, 'group;')).join('')),
  'missing parent': W(V('a', 'nope') + E('e', 'a', 'a', 'gone')),
  'missing ids': W('<mxCell value="x" vertex="1" parent="1"><mxGeometry width="40" height="40" as="geometry"/></mxCell><UserObject label="u"><mxCell vertex="1" parent="1"><mxGeometry width="40" height="40" as="geometry"/></mxCell></UserObject>'),
  'duplicate ids': W(V('a') + V('a', '1', 200) + E('e', 'a', 'a')),
  'dangling edge ends': W(V('a') + E('e', 'a', 'zzz') + E('f', 'yyy', 'xxx')),
  'self loop': W(V('a') + E('e', 'a', 'a')),
  'edge to edge': W(V('a') + V('b', '1', 300) + E('e', 'a', 'b') + E('f', 'e', 'a')),
  'edge label without edge': W('<mxCell id="l" value="lost" style="edgeLabel;" vertex="1" parent="1" connectable="0"><mxGeometry x="0.5" relative="1" as="geometry"/></mxCell>'),
  'huge and invalid numbers': W(V('a', '1', 'Infinity', '-1e308', '1e300', 'NaN') + V('b', '1', 'abc', '', '-50', '-50') + E('e', 'a', 'b', '1', '<Array as="points"><mxPoint x="1e999" y="-Infinity"/><mxPoint/></Array>'), ' gridSize="0.0001"'),
  'grid size huge': W(V('a'), ' gridSize="1e12"'),
  'zero sized shapes': W(V('a', '1', 0, 0, 0, 0) + V('b', '1', 10, 10, 0, 50, 'ellipse;') + E('e', 'a', 'b')),
  'unknown shapes and styles': W(V('a', '1', 0, 0, 80, 40, 'shape=mxgraph.nothing.here;fillColor=notacolour;strokeWidth=abc;rotation=1e9;opacity=-5;fontSize=-3;') + V('b', '1', 200, 0, 80, 40, 'shape=stencil(AAAA);') + V('c', '1', 400, 0, 80, 40, ';;;==;=x;')),
  'bad guides JSON': `<mxfile><diagram name="x" id="x"><mxGraphModel><root><UserObject id="0" deGuides='{"o":"h"}'><mxCell/></UserObject><mxCell id="1" parent="0"/>${V('a')}</root></mxGraphModel></diagram></mxfile>`,
  'guides with junk': `<mxfile><diagram name="x" id="x"><mxGraphModel><root><UserObject id="0" deGuides='[{"o":"h","p":"x"},{"o":"q","p":1},null,{"o":"v","p":40,"c":"red;x"}]'><mxCell/></UserObject><mxCell id="1" parent="0"/>${V('a')}</root></mxGraphModel></diagram></mxfile>`,
  'bad compressed page': '<mxfile><diagram name="x" id="x">!!!not base64!!!</diagram></mxfile>',
  'compressed garbage': '<mxfile><diagram name="x" id="x">AAAAAAAAAAAA</diagram></mxfile>',
  'unicode labels': W(V('a', '1', 0, 0, 120, 40).replace('value="a"', 'value="日本語 😀 עברית &#x202E;rtl"')),
  'deep nesting XML': W('<mxCell id="a" value="' + '&lt;div&gt;'.repeat(400) + 'deep' + '" style="html=1;" vertex="1" parent="1"><mxGeometry width="80" height="40" as="geometry"/></mxCell>'),
  'many pages': '<mxfile>' + Array.from({ length: 40 }, (_, i) => `<diagram name="p${i}" id="p${i}"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>${V('a' + i)}</root></mxGraphModel></diagram>`).join('') + '</mxfile>',
  '600 shapes and lines': W(many(600)),
  'locked and hidden layer': `<mxfile><diagram name="x" id="x"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" parent="0" visible="0" style="locked=1;"/>${V('a', '2')}${V('b')}</root></mxGraphModel></diagram></mxfile>`,
  'not draw.io': '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
  'not XML': 'hello { world',
  'entity expansion': '<?xml version="1.0"?><!DOCTYPE m [<!ENTITY a "aaaaaaaaaa"><!ENTITY b "&a;&a;&a;&a;&a;&a;&a;&a;&a;&a;"><!ENTITY c "&b;&b;&b;&b;&b;&b;&b;&b;&b;&b;"><!ENTITY d "&c;&c;&c;&c;&c;&c;&c;&c;&c;&c;"><!ENTITY e "&d;&d;&d;&d;&d;&d;&d;&d;&d;&d;"><!ENTITY f "&e;&e;&e;&e;&e;&e;&e;&e;&e;&e;"><!ENTITY g "&f;&f;&f;&f;&f;&f;&f;&f;&f;&f;">]><mxfile><diagram name="&g;" id="x"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>'
};
// a compressed page that expands to about 100 MB (decompression bomb)
const bomb = await pg.evaluate(async () => {
  const chunk = new Uint8Array(1 << 20).fill(32), cs = new CompressionStream('deflate-raw'), w = cs.writable.getWriter();
  (async () => { for (let i = 0; i < 100; i++) await w.write(chunk); await w.close(); })();
  const buf = new Uint8Array(await new Response(cs.readable).arrayBuffer()); let s = '';
  for (let i = 0; i < buf.length; i += 8192) s += String.fromCharCode.apply(null, buf.subarray(i, i + 8192));
  return btoa(s);
});
cases['decompression bomb'] = `<mxfile><diagram name="x" id="x">${bomb}</diagram></mxfile>`;

// files that are refused (with a message); every other case must open
const REJECT = ['bad compressed page', 'compressed garbage', 'not draw.io', 'not XML', 'decompression bomb'];
const results = [];
for (const [name, xml] of Object.entries(cases)) {
  const before = errors.length, t0 = Date.now();
  const r = await Promise.race([
    pg.evaluate(async (xml) => {
      const E = DiagramEditor, S = E.S, out = { steps: [] };
      const step = async (n, f) => { try { await f(); out.steps.push(n); } catch (e) { out.err = n + ': ' + e.message; throw e; } };
      try {
        S.dirty = false; document.querySelector('#toast').textContent = '';
        await step('open', () => E.loadText(xml, 'case.drawio'));
        out.opened = /^Opened/.test(document.querySelector('#toast').textContent);
        out.pages = S.doc.pages.length; out.cells = E.page().cells.length;
        await step('render', () => E.renderAll());
        await step('select all', () => E.runCommand('selectAll'));
        await step('move', () => E.mutate(() => { for (const c of E.page().cells) if (S.sel.includes(c.id) && c.v && !c.isEdgeLabel) { c.x += 10; c.y += 10; } }));
        await step('undo/redo', () => { E.runCommand('undo'); E.runCommand('redo'); });
        await step('copy/paste', () => { E.runCommand('copy'); E.runCommand('paste'); E.runCommand('undo'); });
        for (const m of ['filled', 'duotone', 'sketch', 'neon', 'outline']) await step('style ' + m, () => { E.setDiagramStyle(m, {}); if (S.doc.mode !== m) throw new Error('style did not switch'); E.renderAll(); });
        await step('svg', () => { out.svgLen = E.buildExportSvg(E.page()).svg.length; });
        await step('png', async () => { const r = await E.renderToCanvas(E.buildExportSvg(E.page()), 1); r.canvas.toDataURL('image/png'); });
        await step('gliffy', () => E.exportGliffy());
        document.querySelectorAll('.modal, .modalBack, #modalRoot > *').forEach(m => m.remove());
        await step('save+reopen', async () => { const x = E.serializeDoc(S.doc); const d = await E.parseDrawio(x); if (E.serializeDoc(d) !== x) throw new Error('save, reopen, save is not stable'); });
        await step('pages', () => { for (let i = 0; i < Math.min(S.doc.pages.length, 5); i++) { S.pi = i; E.clearCache(); E.renderAll(); } S.pi = 0; });
      } catch (e) { }
      return out;
    }, xml),
    sleep(30000).then(() => ({ timeout: true }))
  ]);
  const ms = Date.now() - t0, errs = errors.slice(before).filter(e => !/Failed to load resource/.test(e));
  results.push({ name, ms, ...r, errs });
  if (r.timeout) { fail(name + ': hung for more than 30 s'); break; }
  if (r.err) fail(name + ': ' + r.err);
  const mustReject = REJECT.includes(name);
  if (!r.timeout && r.opened === mustReject) fail(name + (mustReject ? ': was opened but should be refused with a message' : ': could not be opened'));
  if (errs.length) fail(name + ': ' + errs.join(' | ').slice(0, 400));
}
for (const r of results) console.log((r.err || r.errs.length || r.timeout ? 'BAD ' : 'ok  ') + r.name.padEnd(28) + String(r.ms).padStart(6) + ' ms  pages ' + r.pages + ' cells ' + r.cells);
// files that cannot be opened must leave the current diagram alone and say why
const kept = await pg.evaluate(async () => {
  const E = DiagramEditor; await E.loadText('<mxfile><diagram name="Keep" id="k"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>', 'keep.drawio');
  await E.loadText('hello { world', 'bad.drawio');
  return { name: E.S.doc.pages[0].name, toast: document.querySelector('#toast').textContent };
});
if (kept.name !== 'Keep') fail('a file that could not be opened replaced the current diagram');
if (!/Could not open/.test(kept.toast)) fail('no message for a file that could not be opened: ' + kept.toast);
console.log(errors.filter(e => !/Failed to load resource/.test(e)).join('\n') || 'no errors');
console.log(process.exitCode ? 'Robustness test FAILED' : 'Robustness test passed (' + results.length + ' files)');
await b.close();
