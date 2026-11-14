// Embed mode (docs/EMBED.md): a host page opens the editor in an iframe, sends de:init,
// gets de:ready, de:dirty, de:save (draw.io XML plus an SVG with prefixed ids, no embedded fonts) and de:cancel.
import { open, ROOT } from './harness.mjs';
import { pathToFileURL } from 'url';
import path from 'path';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
await sleep(1200);

// 1. Standalone: no embed mode, the normal file buttons are there
const alone = await pg.evaluate(() => ({ embed: !!DiagramEditor.S.embed, inFrame: DiagramEditor.EMBED.inFrame, save: !!document.querySelector('#toolbar [title^="Save"]') }));
if (alone.embed || alone.inFrame || !alone.save) fail('standalone editor is not normal: ' + JSON.stringify(alone));

// The Blueprint self-test page as the diagram to edit
const xml = await pg.evaluate(async () => {
  const E = DiagramEditor, S = E.S; S.dirty = false; E.runCommand('testDiagram'); await new Promise(r => setTimeout(r, 1000));
  const d = E.newDoc(); d.pages = [S.doc.pages.find(p => p.name === 'Test (Blueprint)')]; return E.serializeDoc(d);
});

// 2. In an iframe: de:ready, still normal until de:init
await pg.evaluate(() => { DiagramEditor.S.dirty = false; }); // leave the standalone editor without its unsaved-changes prompt
await pg.goto(pathToFileURL(path.join(ROOT, 'test', 'embed-host.html')).href);
await sleep(1800);
const frame = pg.frames().find(f => f.url().endsWith('diagram-editor.html'));
if (!frame) { fail('no editor frame'); await b.close(); process.exit(); }
let got = await pg.evaluate(() => window.got);
if (!got.some(m => m && m.type === 'de:ready')) fail('no de:ready: ' + JSON.stringify(got));
const before = await frame.evaluate(() => ({ embed: !!DiagramEditor.S.embed, save: !!document.querySelector('#toolbar [title^="Save"]') }));
if (before.embed || !before.save) fail('editor in an iframe changed before de:init');
// a message that does not come from the parent is ignored
await frame.evaluate(() => window.postMessage({ type: 'de:init', xml: '', title: 'x', mode: 'neon' }, '*'));
await sleep(300);
if (await frame.evaluate(() => !!DiagramEditor.S.embed)) fail('accepted de:init from a source other than the parent');

// 3. de:init with the Blueprint diagram
await pg.evaluate((x) => window.sendInit({ type: 'de:init', xml: x, title: 'Checkout, target state', mode: 'blueprint' }), xml);
await sleep(1200);
const ui = await frame.evaluate(() => {
  const E = DiagramEditor, S = E.S;
  return { embed: !!S.embed, pages: S.doc.pages.map(p => p.name), mode: S.doc.mode, dirty: S.dirty,
    save: !!document.querySelector('#toolbar [title^="Save"]'), open: !!document.querySelector('#toolbar [title^="Open"]'), done: !!document.querySelector('#embedDone'), cancel: !!document.querySelector('#embedCancel') };
});
if (!ui.embed) fail('embed mode not on after de:init');
if (ui.pages.join() !== 'Test (Blueprint)' || ui.mode !== 'blueprint') fail('diagram not loaded: ' + JSON.stringify(ui));
if (ui.save || ui.open || !ui.done || !ui.cancel) fail('toolbar not switched to Done and Cancel: ' + JSON.stringify(ui));
// file commands are blocked; nothing is autosaved
const blocked = await frame.evaluate(() => {
  const E = DiagramEditor, S = E.S; localStorage.removeItem('de-autosave-v1');
  const n = S.doc.pages.length; E.runCommand('new'); E.runCommand('testDiagram');
  E.mutate(() => { S.doc.pages[0].cells[1].value = 'Changed in embed'; });
  window.dispatchEvent(new Event('beforeunload'));
  return { same: S.doc.pages.length === n && S.doc.pages[0].name === 'Test (Blueprint)', autosave: localStorage.getItem('de-autosave-v1') };
});
if (!blocked.same) fail('a file command ran in embed mode');
if (blocked.autosave) fail('autosave wrote to localStorage in embed mode');
await sleep(200);
got = await pg.evaluate(() => window.got);
if (!got.some(m => m.type === 'de:dirty' && m.dirty === true)) fail('no de:dirty true after an edit');

// 4. Done: de:save with XML that reopens to the same diagram, and an SVG ready to place inline
await frame.evaluate(() => DiagramEditor.runCommand('embedDone'));
await sleep(400);
got = await pg.evaluate(() => window.got);
const saves = got.filter(m => m.type === 'de:save');
if (!saves.length) fail('no de:save');
else {
  const s = saves[saves.length - 1];
  if (s.title !== 'Checkout, target state') fail('title not returned');
  if (!(s.width > 100 && s.height > 100)) fail('no size: ' + s.width + ' x ' + s.height);
  const same = await frame.evaluate(async (x) => { const E = DiagramEditor; return E.serializeDoc(await E.parseDrawio(x)) === E.serializeDoc(E.S.doc); }, s.xml);
  if (!same) fail('returned XML does not reopen to the same diagram');
  if (!/Changed in embed/.test(s.xml)) fail('returned XML lacks the edit');
  const svg = s.svg;
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  const pre = ids.length ? ids[0].slice(0, ids[0].indexOf('-') + 1) : '';
  if (!ids.length || !pre || ids.some(id => !id.startsWith(pre))) fail('ids not all prefixed: ' + ids.slice(0, 5).join(', '));
  const refs = [...svg.matchAll(/url\(#([^)]+)\)|href="#([^"]+)"/g)].map(m => m[1] || m[2]);
  if (refs.some(r => !ids.includes(r))) fail('a reference points to a missing id');
  if (/@font-face/.test(svg)) fail('fonts embedded in de:save SVG');
  if (!/<svg[^>]*role="img"/.test(svg) || !/aria-label="Checkout, target state"/.test(svg) || !/<title>Checkout, target state<\/title>/.test(svg)) fail('accessibility attributes missing');
  if (!/<text/.test(svg) || /<foreignObject/.test(svg)) fail('labels not kept as SVG text');
  if (!/viewBox="[^"]+"/.test(svg) || !new RegExp('width="' + s.width + '"').test(svg)) fail('size attributes missing');
  if (!/<pattern/.test(svg)) fail('dot matrix missing from the SVG');
  // a second Done uses different ids, so two diagrams can share a page
  await frame.evaluate(() => DiagramEditor.runCommand('embedDone'));
  await sleep(300);
  const s2 = (await pg.evaluate(() => window.got)).filter(m => m.type === 'de:save').pop();
  const id2 = (s2.svg.match(/\sid="([^"]+)"/) || [])[1] || '';
  if (!id2 || id2.startsWith(pre)) fail('second export reuses the id prefix');
  const dirtyAfter = await frame.evaluate(() => DiagramEditor.S.dirty);
  if (dirtyAfter) fail('still marked dirty after Done');
}
// normal SVG export still embeds the font and has no prefix
const normal = await frame.evaluate(() => DiagramEditor.buildExportSvg(DiagramEditor.page()).svg);
if (!/@font-face/.test(normal) || /role="img"/.test(normal)) fail('normal SVG export changed');

// 5. Cancel: straight away when nothing changed; asks first when there are changes
await frame.evaluate(() => DiagramEditor.runCommand('embedCancel'));
await sleep(200);
if (!(await pg.evaluate(() => window.got)).some(m => m.type === 'de:cancel')) fail('no de:cancel');
const n0 = (await pg.evaluate(() => window.got)).filter(m => m.type === 'de:cancel').length;
await frame.evaluate(() => { const E = DiagramEditor; E.mutate(() => { E.S.doc.pages[0].cells[1].value = 'Another change'; }); E.runCommand('embedCancel'); });
await sleep(200);
const asked = await frame.evaluate(() => !!document.querySelector('.modal'));
if (!asked) fail('Cancel with changes did not ask');
if ((await pg.evaluate(() => window.got)).filter(m => m.type === 'de:cancel').length !== n0) fail('Cancel with changes sent de:cancel without asking');
await frame.evaluate(() => { const bs = Array.from(document.querySelectorAll('.modal footer .btn')); bs[bs.length - 1].click(); });
await sleep(200);
if ((await pg.evaluate(() => window.got)).filter(m => m.type === 'de:cancel').length !== n0 + 1) fail('confirming Cancel did not send de:cancel');

// 6. A new diagram in the requested style
await pg.evaluate(() => window.sendInit({ type: 'de:init', xml: '', title: 'New one', mode: 'blueprint' }));
await sleep(600);
const fresh = await frame.evaluate(() => { const E = DiagramEditor, S = E.S; const c = E.makeVertex('rect', 0, 0, S.doc.mode); return { mode: S.doc.mode, cells: S.doc.pages[0].cells.length, fill: c.style.fillColor }; });
if (fresh.mode !== 'blueprint' || fresh.cells !== 0 || fresh.fill !== '#EAF1F8') fail('new Blueprint diagram: ' + JSON.stringify(fresh));

if (errors.length) fail('page errors: ' + errors.join(' | '));
console.log(process.exitCode ? 'Embed checks FAILED' : 'Embed checks passed');
await b.close();
