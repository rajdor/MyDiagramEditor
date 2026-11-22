// Paste from draw.io XML (Edit menu and the canvas menu): draw.io XML from the clipboard is added to the page as shapes
// and lines. A whole file, one model, a bare root or a run of cells is read, with a code fence or words around it
// ignored; a compressed page too. When the clipboard cannot be read, or holds something else, a box opens to paste
// into. It works in embed mode, where Open is blocked. Hostile labels are cleaned as they are on Open.
import { open, ROOT } from './harness.mjs';
import { pathToFileURL } from 'url';
import path from 'path';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = (name, cond, detail) => { if (!cond) fail(name + (detail === undefined ? '' : ' -> ' + JSON.stringify(detail))); };
await sleep(1200);
const CELLS = '<mxCell id="a" value="Alpha" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#DAE8FC;strokeColor=#6C8EBF;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="144" height="64" as="geometry"/></mxCell>' +
  '<mxCell id="b" value="Beta" style="ellipse;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="280" y="40" width="144" height="64" as="geometry"/></mxCell>' +
  '<mxCell id="e" value="feeds" style="edgeStyle=orthogonalEdgeStyle;html=1;" edge="1" parent="1" source="a" target="b"><mxGeometry relative="1" as="geometry"/></mxCell>';
const ROOTX = '<root><mxCell id="0"/><mxCell id="1" parent="0"/>' + CELLS + '</root>';
const MODEL = '<mxGraphModel dx="800" dy="600">' + ROOTX + '</mxGraphModel>';
const FILE = '<mxfile host="app.diagrams.net"><diagram name="Page-1" id="p1">' + MODEL + '</diagram></mxfile>';
const run = (pgOrFrame, fn, ...a) => pgOrFrame.evaluate(fn, ...a);
const cells = (t) => run(t, () => DiagramEditor.S.doc.pages[DiagramEditor.S.pi].cells.map(c => ({ id: c.id, v: c.value, e: !!c.e, s: c.source || null, t: c.target || null, x: c.x, lab: !!c.isEdgeLabel })));
const reset = (t) => run(t, () => { const S = DiagramEditor.S; S.doc = DiagramEditor.newDoc(); S.pi = 0; S.sel = []; S.undo = []; S.redo = []; DiagramEditor.clearCache(); });
const paste = (t, x) => run(t, (x) => DiagramEditor.pasteXmlText(x), x);

/* what is read out of the text */
const from = await run(pg, (list) => list.map(x => DiagramEditor.drawioXmlFrom(x)), [FILE, 'Here is your diagram:\n\n```xml\n' + FILE + '\n```\nLet me know if you want changes.', '  ' + MODEL + ' trailing words', ROOTX, 'Sure!\n' + CELLS + '\nDone.', 'no diagram here', '<p>some html</p>']);
ok('a whole file is taken as it is', from[0] === FILE);
ok('a code fence and the words around it are dropped', from[1] === FILE, from[1] && from[1].slice(0, 80));
ok('a model with words after it', from[2] === MODEL);
ok('a bare root is wrapped as a model', /^<mxGraphModel><root><mxCell id="0"\/>/.test(from[3]) && (from[3].match(/id="0"/g) || []).length === 1, from[3] && from[3].slice(0, 120));
ok('a run of cells gets the two base cells it needs', /^<mxGraphModel><root><mxCell id="0"\/><mxCell id="1" parent="0"\/><mxCell id="a"/.test(from[4]) && /<\/mxCell><\/root><\/mxGraphModel>$/.test(from[4]), from[4] && from[4].slice(0, 120));
ok('text with no draw.io XML gives nothing', from[5] === null && from[6] === null, from.slice(5));

/* a whole file onto an empty page */
await reset(pg);
let why = await paste(pg, FILE); let c = await cells(pg);
const boxes = () => c.filter(x => !x.e && !x.lab), lines = () => c.filter(x => x.e);
ok('a file is added: two shapes and a line', why === '' && boxes().length === 2 && lines().length === 1, [why, c]);
ok('the labels come across', ['Alpha', 'Beta'].every(v => c.some(x => x.v === v)) && (lines()[0].v === 'feeds' || c.some(x => x.lab && x.v === 'feeds')), c.map(x => x.v));
ok('the line is attached to both shapes, under new ids', lines()[0].s === boxes()[0].id && lines()[0].t === boxes()[1].id && !['a', 'b', 'e'].includes(boxes()[0].id), lines()[0]);
ok('on an empty page the shapes stay where the XML put them', boxes()[0].x === 40 && boxes()[1].x === 280, boxes().map(x => x.x));
ok('what was pasted is selected', (await run(pg, () => DiagramEditor.S.sel.length)) >= 2);
ok('the toast says what was added', /Pasted 2 shapes and 1 line/.test(await run(pg, () => document.body.innerText)));
ok('the editor\'s own clipboard is left as it was', await run(pg, () => !DiagramEditor.S.clipboard));
await run(pg, () => DiagramEditor.runCommand('undo')); c = await cells(pg);
ok('one undo takes it all out again', c.length === 0, c.length);

/* the other forms */
for (const [name, text] of [['a model', MODEL], ['a bare root', ROOTX], ['a run of cells', CELLS], ['a fenced answer', 'Here you go:\n```xml\n' + MODEL + '\n```']]) {
  await reset(pg); why = await paste(pg, text); c = await cells(pg);
  ok(name + ' is added with its line attached', why === '' && boxes().length === 2 && lines().length === 1 && lines()[0].s === boxes()[0].id && lines()[0].t === boxes()[1].id, [why, c.length]);
}
const packed = await run(pg, async (model) => { const s = new Blob([encodeURIComponent(model)]).stream().pipeThrough(new CompressionStream('deflate-raw')); const u = new Uint8Array(await new Response(s).arrayBuffer()); let bin = ''; u.forEach(v => { bin += String.fromCharCode(v); }); return '<mxfile><diagram name="Packed">' + btoa(bin) + '</diagram></mxfile>'; }, MODEL);
await reset(pg); why = await paste(pg, packed); c = await cells(pg);
ok('a compressed page is read', why === '' && boxes().length === 2 && lines().length === 1, [why, c.length]);
why = await paste(pg, FILE); c = await cells(pg);
ok('a second paste adds to what is there', why === '' && boxes().length === 4 && lines().length === 2 && new Set(c.map(x => x.id)).size === c.length, c.length);
await reset(pg); why = await paste(pg, '<mxfile><diagram name="Empty"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram><diagram name="Full">' + MODEL + '</diagram></mxfile>'); c = await cells(pg);
ok('the first page that has shapes is the one added', why === '' && boxes().length === 2, [why, c.length]);

/* what cannot be read says why and adds nothing */
await reset(pg);
const bad = [await paste(pg, 'just some words'), await paste(pg, '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="a" value="cut sho</root></mxGraphModel>'), await paste(pg, '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>')];
ok('each refusal gives its reason', /No draw\.io XML/.test(bad[0]) && /not valid XML/.test(bad[1]) && /no shapes/.test(bad[2]), bad);
ok('and nothing is added', (await cells(pg)).length === 0);

/* hostile labels are cleaned as on Open */
await paste(pg, '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="h" value="&lt;img src=x onerror=&quot;window.pwned=1&quot;&gt;Safe&lt;script&gt;window.pwned=2&lt;/script&gt;" style="rounded=0;html=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="144" height="64" as="geometry"/></mxCell></root></mxGraphModel>');
await sleep(300);
ok('a hostile label runs nothing and leaves no handler on the page', await run(pg, () => !window.pwned && !document.querySelector('[onerror]') && /Safe/.test(document.body.textContent)));

/* the command: from the clipboard when it can be read */
const menu = async (t) => run(t, () => { const m = [...document.querySelectorAll('#menus *')].find(e => e.textContent.trim() === 'Edit'); if (!m) return null; m.click(); const items = [...document.querySelectorAll('#menuPopup *')].filter(e => !e.children.length).map(e => e.textContent.trim()); m.click(); return items; });
const items = await menu(pg);
ok('the Edit menu holds the command', !!items && items.some(t => /^Paste from draw\.io XML \(clipboard\)/.test(t)), items && items.slice(0, 30));
await reset(pg);
await run(pg, (x) => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { readText: () => Promise.resolve(x), writeText: () => Promise.resolve() } }); }, 'Copilot says:\n```xml\n' + FILE + '\n```');
await run(pg, () => DiagramEditor.runCommand('pasteXml')); await sleep(400); c = await cells(pg);
ok('with the clipboard readable the command adds the shapes at once, with no box', boxes().length === 2 && lines().length === 1 && !(await run(pg, () => !!document.querySelector('#pasteXmlText'))), c.length);

/* the command: a box to paste into when the clipboard cannot be read */
await reset(pg);
await run(pg, () => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { readText: () => Promise.reject(new Error('denied')), writeText: () => Promise.resolve() } }); });
await run(pg, () => DiagramEditor.runCommand('pasteXml')); await sleep(400);
ok('with the clipboard closed a box opens and says why', await run(pg, () => { const t = document.querySelector('#pasteXmlText'), w = document.querySelector('#pasteXmlWhy'); return !!t && t.value === '' && /did not let the editor read the clipboard/.test(w.textContent); }));
const press = (label) => run(pg, (label) => { const x = [...document.querySelectorAll('#modalRoot footer button')].find(e => e.textContent === label); if (x) x.click(); return !!x; }, label);
await run(pg, () => { document.querySelector('#pasteXmlText').value = 'not a diagram'; }); await press('Add to diagram'); await sleep(300);
ok('text that is not draw.io XML keeps the box open with the reason', await run(pg, () => !!document.querySelector('#pasteXmlText') && /No draw\.io XML/.test(document.querySelector('#pasteXmlWhy').textContent)) && (await cells(pg)).length === 0);
await run(pg, (x) => { document.querySelector('#pasteXmlText').value = x; }, MODEL); await press('Add to diagram'); await sleep(400); c = await cells(pg);
ok('draw.io XML pasted into the box is added and the box closes', boxes().length === 2 && lines().length === 1 && !(await run(pg, () => !!document.querySelector('#pasteXmlText'))), c.length);
await reset(pg);
await run(pg, () => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { readText: () => Promise.resolve('a shopping list'), writeText: () => Promise.resolve() } }); });
await run(pg, () => DiagramEditor.runCommand('pasteXml')); await sleep(400);
ok('a clipboard holding something else opens the box empty, with the reason', await run(pg, () => { const t = document.querySelector('#pasteXmlText'); return !!t && t.value === '' && /No draw\.io XML/.test(document.querySelector('#pasteXmlWhy').textContent); }));
await press('Cancel'); await sleep(200);
ok('Cancel closes it and adds nothing', !(await run(pg, () => !!document.querySelector('#pasteXmlText'))) && (await cells(pg)).length === 0);

/* embed mode: Open is blocked there, this is not */
await run(pg, () => { DiagramEditor.S.dirty = false; });
await pg.goto(pathToFileURL(path.join(ROOT, 'test', 'embed-host.html')).href); await sleep(1800);
const frame = pg.frames().find(f => f.url().endsWith('diagram-editor.html'));
if (!frame) fail('no editor frame');
else {
  await pg.evaluate(() => window.sendInit({ type: 'de:init', xml: '', title: 'New', mode: 'blueprint' })); await sleep(900);
  await run(frame, (x) => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { readText: () => Promise.resolve(x), writeText: () => Promise.resolve() } }); }, FILE);
  await run(frame, () => DiagramEditor.runCommand('pasteXml')); await sleep(500); c = await cells(frame);
  ok('in embed mode the command adds the shapes', (await run(frame, () => !!DiagramEditor.S.embed)) && boxes().length === 2 && lines().length === 1, c.length);
  await pg.evaluate(() => { window.got.length = 0; }); await run(frame, () => DiagramEditor.embedDone()); await sleep(900);
  const saved = await pg.evaluate(() => window.got.find(m => m && m.type === 'de:save'));
  ok('and Done returns them to the host', !!saved && /Alpha/.test(saved.xml) && /Beta/.test(saved.svg), saved && Object.keys(saved));
}
if (errors.length) fail('page errors: ' + errors.join(' | '));
console.log(process.exitCode ? 'Paste from draw.io XML checks FAILED' : 'Paste from draw.io XML checks passed');
await b.close();
