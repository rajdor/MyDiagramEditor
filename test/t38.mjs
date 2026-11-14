// Export formats are valid files: PDF structure (cross-reference offsets, page size, Unicode title), SVG is
// well-formed XML with a viewBox and no script, PNG has the right signature and size, and saved draw.io XML
// opens again. Uses a file name with Unicode and PDF special characters.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = (c, m) => { if (!c) fail(m); else console.log('ok: ' + m); };
await sleep(900);
await pg.evaluate(() => {
  window.__dl = []; const orig = URL.createObjectURL; window.__blobs = new Map();
  URL.createObjectURL = (blob) => { const u = orig(blob); window.__blobs.set(u, blob); return u; };
  HTMLAnchorElement.prototype.click = function () { window.__dl.push({ name: this.download, blob: window.__blobs.get(this.href) }); };
});
const last = () => pg.evaluate(async () => { const d = window.__dl[window.__dl.length - 1]; const u8 = new Uint8Array(await d.blob.arrayBuffer()); let s = ''; for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192)); return { name: d.name, bin: s, type: d.blob.type }; });
await pg.evaluate(async () => { const E = DiagramEditor; E.runCommand('testDiagram'); await new Promise(r => setTimeout(r, 600)); E.S.file.name = 'Ünïcode (test) \\ 😀.drawio'; });

// PDF
await pg.evaluate(() => DiagramEditor.runCommand('exportPdf')); await sleep(3000);
const pdf = await last();
ok(pdf.name.endsWith('.pdf') && pdf.bin.startsWith('%PDF-1.4'), 'PDF has a PDF header (' + pdf.name + ')');
const sx = pdf.bin.lastIndexOf('startxref'), xrefAt = parseInt(pdf.bin.slice(sx + 9).trim());
ok(pdf.bin.slice(xrefAt, xrefAt + 4) === 'xref', 'startxref points at the cross-reference table');
const offs = [...pdf.bin.slice(xrefAt).matchAll(/^(\d{10}) 00000 n $/gm)].map(m => +m[1]);
ok(offs.length === 6 && offs.every((o, i) => pdf.bin.startsWith((i + 1) + ' 0 obj', o)), 'every object offset in the cross-reference table is exact');
ok(/\/MediaBox \[0 0 [\d.]+ [\d.]+\]/.test(pdf.bin) && pdf.bin.trimEnd().endsWith('%%EOF'), 'PDF has a page size and ends with %%EOF');
const t = /\/Title <FEFF([0-9a-f]*)>/.exec(pdf.bin);
const title = t ? String.fromCharCode(...t[1].match(/.{4}/g).map(h => parseInt(h, 16))) : null;
ok(title === 'Ünïcode (test) \\ 😀', 'PDF title keeps the Unicode file name exactly: ' + JSON.stringify(title));

// SVG
await pg.evaluate(() => DiagramEditor.runCommand('exportSvg')); await sleep(400);
const svg = await last();
const sv = await pg.evaluate((s) => { const d = new DOMParser().parseFromString(decodeURIComponent(escape(s)), 'image/svg+xml'); return { err: !!d.querySelector('parsererror'), root: d.documentElement.nodeName, vb: d.documentElement.getAttribute('viewBox'), script: !!d.querySelector('script, foreignObject') }; }, svg.bin);
ok(!sv.err && sv.root === 'svg' && /^-?\d+ -?\d+ \d+ \d+$/.test(sv.vb || ''), 'SVG is well-formed with a viewBox');
ok(!sv.script, 'SVG has no script and no HTML (foreignObject), so it opens safely anywhere');

// PNG at 2x through the export dialog
await pg.evaluate(() => DiagramEditor.runCommand('exportPng')); await sleep(200);
await pg.evaluate(() => { const bs = Array.from(document.querySelectorAll('.modal footer .btn')); bs[bs.length - 1].click(); }); await sleep(2500);
const png = await last();
const be32 = (s, o) => ((s.charCodeAt(o) << 24) >>> 0) + (s.charCodeAt(o + 1) << 16) + (s.charCodeAt(o + 2) << 8) + s.charCodeAt(o + 3);
const ex = await pg.evaluate(() => { const e = DiagramEditor.buildExportSvg(DiagramEditor.page()); return { w: e.w, h: e.h }; });
ok(png.bin.startsWith('\x89PNG\r\n\x1a\n') && png.bin.slice(12, 16) === 'IHDR', 'PNG has the PNG signature');
const pw = be32(png.bin, 16), ph = be32(png.bin, 20);
ok(Math.abs(pw - ex.w * 2) <= 2 && Math.abs(ph - ex.h * 2) <= 2, 'PNG is 2x the diagram size (' + pw + 'x' + ph + ' for ' + ex.w + 'x' + ex.h + ')');

// draw.io XML: what Save writes opens again, page for page and cell for cell
const rt = await pg.evaluate(async () => {
  const E = DiagramEditor, x = E.serializeDoc(E.S.doc), d = await E.parseDrawio(x);
  return { pages: d.pages.length === E.S.doc.pages.length, cells: d.pages.every((p, i) => p.cells.length === E.S.doc.pages[i].cells.length), same: E.serializeDoc(d) === x };
});
ok(rt.pages && rt.cells && rt.same, 'saved draw.io XML opens again unchanged (every page and cell)');
console.log(errors.filter(e => !/Failed to load resource/.test(e)).join('\n') || 'no errors');
console.log(process.exitCode ? 'Export format test FAILED' : 'Export format test passed');
await b.close();
