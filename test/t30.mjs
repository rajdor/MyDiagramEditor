// Phosphor icons: path conversion is faithful, stencils decode the way draw.io decodes them and draw with mxGraph,
// icons survive save and reopen, and the Gliffy export embeds them as images.
import zlib from 'zlib';
import { open, launch } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
await sleep(900);
await pg.evaluate(() => DiagramEditor.loadPhosphor());

// 1. parsePathAbs + pathAbsToD reproduce every regular, fill and duotone glyph (raster comparison at 64 px)
const diff = await pg.evaluate(async () => {
  const E = DiagramEditor, list = E.PH.list, worst = [];
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const ctx = cv.getContext('2d', { willReadFrequently: true });
  const draw = async (d1, d2) => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="64" viewBox="0 0 512 256"><path d="' + d1 + '"/><path transform="translate(256 0)" d="' + d2 + '"/></svg>';
    const img = new Image(); img.src = 'data:image/svg+xml,' + encodeURIComponent(svg); await img.decode();
    ctx.clearRect(0, 0, 128, 64); ctx.drawImage(img, 0, 0);
    const a = ctx.getImageData(0, 0, 64, 64).data, b2 = ctx.getImageData(64, 0, 64, 64).data;
    let dd = 0, ink = 0; for (let i = 3; i < a.length; i += 4) { dd += Math.abs(a[i] - b2[i]); ink += a[i]; }
    return ink ? dd / ink : 0;
  };
  let n = 0;
  for (const ic of list) for (const d of [ic.reg, ic.fill, ic.duoFg]) {
    const conv = E.pathAbsToD(E.parsePathAbs(d), 1, 0, 0), r = await draw(d, conv); n++;
    if (r > 0.02) worst.push([ic.name, r.toFixed(3)]);
  }
  return { n, worst: worst.slice(0, 10), bad: worst.length };
});
if (diff.bad) fail(diff.bad + ' glyphs differ after conversion, e.g. ' + JSON.stringify(diff.worst));

// 2. icons: in memory without stencil; saved with stencil; reopened as icons
const rt = await pg.evaluate(async () => {
  const E = DiagramEditor, S = E.S;
  S.doc = E.newDoc(); S.pi = 0; S.styleOpts = {}; E.clearCache();
  const names = ['database', 'cloud', 'user', 'git-branch', 'webhooks-logo'];
  names.forEach((n, i) => E.page().cells.push(E.makeIconVertex(n, i * 80, 0, 'outline')));
  E.setDiagramStyle('duotone', {});
  const xml = E.serializeDoc(S.doc);
  const codes = [...xml.matchAll(/shape=stencil\(([^)]+)\)/g)].map(m => m[1]);
  const doc2 = await E.parseDrawio(xml);
  const back = doc2.pages[0].cells.filter(c => c.style.dePh).map(c => [c.style.dePh, c.style.deW, !!c.style.shape, c.style.deC2 || '']);
  return { codes, back, inMemory: S.doc.pages[0].cells.some(c => c.style.shape) };
});
if (rt.inMemory) fail('icons hold stencils in memory');
if (rt.codes.length !== 5) fail('expected 5 stencils in saved XML, got ' + rt.codes.length);
if (rt.back.length !== 5 || rt.back.some(x => x[1] !== 'duotone' || x[2] || !x[3])) fail('icons did not reopen correctly: ' + JSON.stringify(rt.back));
// decode exactly as draw.io does: base64, raw inflate, URI decode
const xmls = [];
for (const code of rt.codes) {
  try { const x = decodeURIComponent(zlib.inflateRawSync(Buffer.from(code, 'base64')).toString('latin1')); xmls.push(x); if (!/^<shape [^>]*w="256" h="256"/.test(x) || !/<path>/.test(x) || !/<fill\/>/.test(x) || !/<alpha alpha="0.2"\/>/.test(x)) fail('stencil XML unexpected: ' + x.slice(0, 80)); }
  catch (e) { fail('stencil does not decode like draw.io: ' + e.message); }
}

// 3. mxGraph (draw.io's engine) parses and draws the stencils
const bm = await launch();
const p = await bm.newPage(); await p.setViewport({ width: 520, height: 160 });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto(new URL('mx.html', import.meta.url).href); await sleep(300);
const drawn = await p.evaluate((xmls) => {
  const g = new mxGraph(document.getElementById('g')); const P = g.getDefaultParent();
  g.getModel().beginUpdate();
  xmls.forEach((x, i) => { mxStencilRegistry.addStencil('ph' + i, new mxStencil(mxUtils.parseXml(x).documentElement)); g.insertVertex(P, null, '', 20 + i * 100, 20, 80, 80, 'shape=ph' + i + ';fillColor=#2563eb;strokeColor=none;'); });
  g.getModel().endUpdate();
  return [...document.querySelectorAll('#g svg path')].filter(pth => (pth.getAttribute('d') || '').length > 40).length;
}, xmls);
await sleep(200);
await p.screenshot({ path: 'test/out/s_phosphor_mx.png' });
if (errs.length || drawn < 5) fail('mxGraph could not draw the stencils: ' + errs.join('; ') + ' paths=' + drawn);
await bm.close();

// 4. Gliffy export: styles converted, icons embedded, nothing dropped
const gl = await pg.evaluate(() => {
  const E = DiagramEditor, doc = E.deep(E.S.doc), rep = [], srep = [];
  const before = doc.pages[0].cells.length;
  for (const t of E.GLIFFY_TRANSFORMS) t.run(doc, rep, srep);
  const cells = doc.pages[0].cells;
  return { same: cells.length === before, images: cells.filter(c => c.style.shape === 'image' && /^data:image\/svg\+xml,/.test(c.style.image || '')).length, modes: [...new Set(cells.map(c => E.modeOf(c)))], srep: srep.length };
});
if (!gl.same) fail('Gliffy export dropped shapes');
if (gl.images !== 5) fail('Gliffy export embedded ' + gl.images + ' icons');
if (gl.modes.includes('duotone') || gl.modes.includes('sketch') || gl.modes.includes('neon')) fail('Gliffy export left unsupported styles: ' + gl.modes);
console.log(diff.n + ' glyph paths compared; stencils drawn by mxGraph: ' + drawn + '; Gliffy changes listed: ' + gl.srep);
console.log(errors.join('\n') || 'no errors');
console.log(process.exitCode ? 'phosphor test FAILED' : 'phosphor test passed');
await b.close();
