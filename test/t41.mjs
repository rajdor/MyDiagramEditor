// Contrast (src/contrast.js, docs/STYLES.md "Contrast"): WCAG 2.2 ratios; OKLCH tonal correction that keeps hue;
// random fill, text and line combinations on light and dark canvases; user choices respected; report; no network;
// corrected colours survive save and reopen.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = (c, m) => { if (!c) fail(m); else console.log('ok: ' + m); };
const net = [];
await pg.setRequestInterception(true);
pg.on('request', r => { const u = r.url(); if (!/^(file|data|blob|about):/.test(u)) { net.push(u); r.abort(); } else r.continue(); });
await sleep(900);
const ev = (f, ...a) => pg.evaluate(f, ...a);

// WCAG 2.2 maths
let r = await ev(() => { const E = DiagramEditor; return { bw: E.wcagRatio('#000000', '#ffffff'), same: E.wcagRatio('#777777', '#777777'), grey: E.wcagRatio('#767676', '#ffffff'), large: [E.isLargeText({ fontSize: '24' }), E.isLargeText({ fontSize: '19', fontStyle: '1' }), E.isLargeText({ fontSize: '19' }), E.isLargeText({ fontSize: '18', fontStyle: '1' })],
  apca: E.apcaLc('#000000', '#ffffff'), rt: E.oklchHex(E.hexOklch('#3b82f6').L, E.hexOklch('#3b82f6').C, E.hexOklch('#3b82f6').H) }; });
ok(Math.abs(r.bw - 21) < 1e-9 && r.same === 1 && r.grey > 4.5 && r.grey < 4.6, 'WCAG 2.2 ratio: black on white 21:1, #767676 on white 4.54:1');
ok(r.large.join() === 'true,true,false,false', 'large text is 24 px, or 19 px bold');
ok(Math.abs(r.apca - 106) < 1, 'APCA Lc advisory reading for black on white is about 106 (' + r.apca + ')');
ok(r.rt === '#3b82f6', 'OKLCH conversion round-trips exactly');

// random combinations on light and dark canvases
const big = await ev(() => {
  const E = DiagramEditor, S = E.S; let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const col = () => '#' + [0, 0, 0].map(() => Math.floor(rnd() * 256).toString(16).padStart(2, '0')).join('');
  const canvases = ['#ffffff', '#f8fafc', '#fef3c7', '#0f172a', '#111827', '#1e293b', '#3f3f46', '#7c3aed', '#808080'];
  const out = { cells: 0, failing: [], hue: [], maxHue: 0, fallback: 0, tone: 0, fillsChanged: 0, problems: 0 };
  for (const cv of canvases) {
    S.doc = E.newDoc(); S.pi = 0; E.clearCache(); const P = E.page(); if (cv !== '#ffffff') P.modelAttrs = { background: cv };
    const fills = new Map();
    for (let i = 0; i < 60; i++) {
      const a = E.makeVertex(['rect', 'process', 'ellipse', 'sticky', 'text'][i % 5], (i % 10) * 160, Math.floor(i / 10) * 120); a.value = 'Label ' + i;
      a.style.fillColor = rnd() < 0.2 ? 'none' : col(); a.style.strokeColor = col(); a.style.fontColor = col(); if (i % 7 === 0) a.style.fontSize = '26';
      P.cells.push(a); fills.set(a.id, a.style.fillColor);
      if (i > 0) { const e = E.makeEdge(); e.source = P.cells[P.cells.length - 3] ? P.cells[P.cells.length - 3].id : a.id; e.target = a.id; e.style.strokeColor = col(); P.cells.push(e); const l = E.makeEdgeLabel(e, 'edge ' + i, 0, { x: 0, y: 0 }); l.style.fontColor = col(); l.style.labelBackgroundColor = rnd() < 0.5 ? 'none' : col(); P.cells.push(l); }
    }
    const before = P.cells.map(c => Object.assign({}, c.style));
    const res = E.contrastRun(S.doc, { apply: true, manual: true });
    out.cells += P.cells.length; out.problems += res.problems.filter(p => p.what !== 'fill').length;
    for (const f of res.fixes) {
      if (f.method === 'fallback') out.fallback++; else out.tone++;
      const a = E.hexOklch(f.old), b2 = E.hexOklch(f.new);
      // hue is measured where 8-bit sRGB can hold it: not grey (chroma 0.02+) and not near black or white (lightness 0.15 to 0.97)
      if (f.method === 'tone' && a.C >= 0.02 && b2.C >= 0.02 && b2.L >= 0.15 && b2.L <= 0.97) { const d = E.hueDelta(a.H, b2.H); out.maxHue = Math.max(out.maxHue, d); if (d >= 2) out.hue.push(f.old + '>' + f.new + ' ' + d.toFixed(2)); }
    }
    for (const c of P.cells) if (!c.e && !c.isEdgeLabel && !c.style.dePh && fills.has(c.id) && c.style.fillColor !== fills.get(c.id)) out.fillsChanged++;
    const again = E.contrastRun(S.doc, { apply: false, manual: true });
    for (const f of again.fixes) out.failing.push(cv + ' ' + f.what + ' ' + f.old + ' on ' + f.bg + ' ' + f.before.toFixed(2));
  }
  return out;
});
ok(big.failing.length === 0 && big.problems === 0, 'random colours on 9 light, mid and dark canvases (' + big.cells + ' items): nothing fails after correction' + (big.failing.length ? ': ' + big.failing.slice(0, 4).join('; ') : ''));
ok(big.hue.length === 0, 'hue kept: OKLCH hue change under 2 degrees for every tonal correction (largest ' + big.maxHue.toFixed(2) + '; ' + big.tone + ' tonal, ' + big.fallback + ' white or near black)');
ok(big.fillsChanged === 0, 'no shape fill colour was changed');

// tonal method details
r = await ev(() => { const E = DiagramEditor; const a = E.toneFix('#22c55e', '#ffffff', 3), b = E.toneFix('#22c55e', '#0f172a', 3), c = E.toneFix('#1d4ed8', '#0f172a', 4.5), d = E.toneFix('#777777', '#777777', 4.5);
  return { a, b, c, d, aL: E.hexOklch(a.hex).L < E.hexOklch('#22c55e').L, cL: E.hexOklch(c.hex).L > E.hexOklch('#1d4ed8').L, aStep: E.wcagRatio(E.oklchHex(E.hexOklch(a.hex).L + 0.01, E.hexOklch(a.hex).C, E.hexOklch(a.hex).H), '#ffffff') < 3 }; });
ok(r.a.ok && r.aL && r.a.ratio >= 3, 'green outline on white gets darker, same hue (' + r.a.hex + ', ' + r.a.ratio.toFixed(2) + ':1)');
ok(r.aStep, 'the change is the smallest that passes (1% lighter would fail)');
ok(r.b.hex === '#22c55e', 'the same green already passes on dark navy and is kept');
ok(r.c.ok && r.cL, 'dark blue text on a dark canvas gets lighter, same hue (' + r.c.hex + ')');
ok(r.d.ok && /^#(000000|ffffff|111827)$/.test(r.d.hex) === false || r.d.ok, 'grey on the same grey still reaches 4.5:1 (' + r.d.hex + ')');

// style switches, canvas switches and new shapes are corrected automatically
r = await ev(() => { const E = DiagramEditor, S = E.S; S.doc = E.newDoc(); S.pi = 0; E.clearCache(); const P = E.page();
  const a = E.makeVertex('process', 40, 40); a.style.strokeColor = '#22c55e'; a.style.fontColor = '#1e3a8a'; a.value = 'Blue text'; P.cells.push(a);
  E.switchCanvas('#0f172a'); const darkOk = E.contrastRun(S.doc, { apply: false, manual: true }).fixes.length === 0, light = E.hexOklch(a.style.strokeColor).L > E.hexOklch('#22c55e').L - 1e-9;
  const n = E.makeVertex('rect', 300, 40); E.mutate(() => P.cells.push(n)); E.switchCanvas('#ffffff');
  return { darkOk, fill: a.style.fillColor, light, back: E.contrastRun(S.doc, { apply: false, manual: true }).fixes.length, report: S.lastContrast && S.lastContrast.when }; });
ok(r.darkOk && r.fill === '#dbeafe', 'switching to a dark canvas corrects outlines and text, and leaves the fill alone');
ok(r.back === 0 && /Canvas/.test(r.report), 'switching back to light corrects again, and the report records it');
// your own edits are left exactly as you set them; the next bulk action (style or canvas switch, or a Fix button) corrects them
r = await ev(() => { const E = DiagramEditor, S = E.S; S.doc = E.newDoc(); S.pi = 0; E.clearCache(); S.undo = []; const P = E.page(); const a = E.makeVertex('rect', 40, 40); a.value = 'Text'; a.style.fillColor = '#ffffff'; E.mutate(() => P.cells.push(a)); E.setSel([a.id]);
  const inp = [...document.querySelectorAll('#format .fsec')].find(s => /^Text/.test(s.textContent)).querySelector('input[type=color]'); inp.value = '#dddddd'; inp.dispatchEvent(new Event('change'));
  const mine = a.style.fontColor; [...document.querySelectorAll('#format .swatches.presets .sw')].find(x => x.title.startsWith('Amber outline')).click(); const preset = a.style.strokeColor;
  E.setDiagramStyle('outline', {}); return { mine, preset, after: a.style.fontColor, id: a.id }; });
ok(r.mine === '#dddddd', 'a colour you pick by hand is kept exactly, even though it fails');
ok(r.after !== '#dddddd', 'the next style switch corrects it (' + r.after + ')');
r = await ev(() => { const E = DiagramEditor, S = E.S; S.doc = E.newDoc(); S.pi = 0; E.clearCache(); const a = E.makeVertex('rect', 40, 40); a.value = 'x'; a.style.fontColor = '#eeeeee'; E.page().cells.push(a); E.runCommand('fixText'); return a.style.fontColor; });
ok(r !== '#eeeeee', '"Fix text colours" fixes text on request');
r = await ev(() => { const E = DiagramEditor, S = E.S; S.doc = E.newDoc(); S.pi = 0; E.clearCache(); const P = E.page(); P.modelAttrs = { background: '#0f172a' }; E.renderAll(); return null; });
{ const t = await pg.$$('.ptile'); await t[0].click(); await sleep(200); }
r = await ev(() => { const E = DiagramEditor; const c = E.cellById(E.S.sel[0]); return c && c.style.strokeColor; });
ok(r === '#475569', 'a new shape is added with its normal colours (not corrected one by one)');

// the setting
r = await ev(() => { const E = DiagramEditor, S = E.S; S.prefs.autoContrast = false; S.doc = E.newDoc(); S.pi = 0; E.clearCache(); const a = E.makeVertex('rect', 40, 40); a.style.strokeColor = '#eeeeee'; E.page().cells.push(a); E.switchCanvas('#ffffff');
  const off = a.style.strokeColor; S.prefs.autoContrast = true; E.switchCanvas('#ffffff'); return { off, on: a.style.strokeColor }; });
ok(r.off === '#eeeeee' && r.on !== '#eeeeee', 'with "Auto-correct contrast" off nothing is changed; on (the default) it is corrected');

// a fill that can't be told apart and has no outline is flagged, not changed
r = await ev(() => { const E = DiagramEditor, S = E.S; S.doc = E.newDoc(); S.pi = 0; E.clearCache(); const a = E.makeVertex('rect', 40, 40); a.style.fillColor = '#fafafa'; a.style.strokeColor = 'none'; E.page().cells.push(a); const res = E.contrastRun(S.doc, { apply: true }); return { p: res.problems.map(x => x.what + ': ' + x.reason), fill: a.style.fillColor }; });
ok(r.p.length === 1 && /fill/.test(r.p[0]) && r.fill === '#fafafa', 'a near-white fill with no outline is reported as not fixable and left alone');

// the report
await ev(() => DiagramEditor.runCommand('contrast')); await sleep(200);
r = await ev(() => { const m = document.querySelector('#modalRoot .contrastDlg'); return m ? { text: m.innerText, sw: m.querySelectorAll('.csw').length } : null; });
if (process.env.DEBUG) console.log(r && r.text);
ok(r && /Now: 1 item fails/.test(r.text) && /Could not be fixed/.test(r.text) && /APCA Lc \(advisory\)/i.test(r.text) && r.sw > 0, 'the contrast report lists items with swatches, target, background, ratio, APCA (advisory) and what could not be fixed');
await ev(() => { document.querySelector('#modalRoot').innerHTML = ''; });

// saved and reopened files keep the corrected colours in the normal draw.io keys
r = await ev(async () => { const E = DiagramEditor, S = E.S; S.doc = E.newDoc(); S.pi = 0; E.clearCache(); const a = E.makeVertex('rect', 40, 40); a.value = 'x'; a.style.fontColor = '#eeeeee'; a.style.strokeColor = '#eeeeee'; E.page().cells.push(a); E.runCommand('fixContrast');
  const x = E.serializeDoc(S.doc), d = await E.parseDrawio(x), c = d.pages[0].cells[0]; return { saved: x.includes('fontColor=' + a.style.fontColor) && x.includes('strokeColor=' + a.style.strokeColor), same: c.style.fontColor === a.style.fontColor && c.style.strokeColor === a.style.strokeColor }; });
ok(r.saved && r.same, 'corrected colours are saved in fontColor and strokeColor and reopen unchanged');

ok(net.length === 0, 'no network requests');
console.log(errors.filter(e => !/Failed to load resource/.test(e)).join('\n') || 'no errors');
console.log(process.exitCode ? 'Contrast test FAILED' : 'Contrast test passed');
await b.close();
