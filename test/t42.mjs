// Blueprint style (docs/STYLES.md, permutations 21 to 30): tokens, states, markers, line types, shadows,
// double outline, dot matrix, Harvey balls, checklist, switching in and out, exports, draw.io round trip, hostile values.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
await sleep(1500);

const r = await pg.evaluate(async () => {
  const E = DiagramEditor, S = E.S, out = { fails: [] };
  const F = (m) => out.fails.push(m);
  const eq = (a, b, m) => { if (String(a).toLowerCase() !== String(b).toLowerCase()) F(m + ': expected ' + b + ', got ' + a); };
  const build = () => {
    S.doc = E.newDoc(); S.pi = 0; S.undo = []; S.redo = []; S.sel = []; S.styleOpts = {}; E.clearCache();
    const cells = E.page().cells, add = (c) => { cells.push(c); return c; };
    const rect = add(E.makeVertex('rect', 40, 40, 'outline')); rect.value = 'Gateway';
    const proc = add(E.makeVertex('process', 240, 40, 'outline')); proc.value = 'Orders';
    const term = add(E.makeVertex('terminator', 440, 40, 'outline'));
    const cont = add(E.makeVertex('container', 20, 160, 'outline'));
    const txt = add(E.makeVertex('text', 420, 200, 'outline')); txt.value = 'Small note';
    const ic = add(E.makeIconVertex('database', 520, 200, 'outline')); ic.style.fillColor = '#2563eb';
    const e = add(E.makeEdge('outline')); e.source = rect.id; e.target = proc.id;
    const er = add(E.makeEdge('outline')); er.source = proc.id; er.target = term.id; er.style.endArrow = 'ERmany'; er.style.startArrow = 'ERmandOne';
    const lbl = add(E.makeEdgeLabel(e, 'calls', 0, { x: 0, y: 0 }));
    const hv = add(E.makeVertex('harvey50', 600, 40, 'outline'));
    E.refreshMap();
    return { rect, proc, term, cont, txt, ic, e, er, lbl, hv };
  };
  const BP = E.BP;

  // 1. Outline to Blueprint: one step, tokens by role
  let c = build();
  const pre = JSON.stringify(S.doc), undoN = S.undo.length;
  E.setDiagramStyle('blueprint', {});
  if (S.doc.mode !== 'blueprint') F('mode is ' + S.doc.mode);
  if (S.undo.length !== undoN + 1) F('switch is not one undo step');
  eq(c.rect.style.fillColor, BP.fill, 'shape fill'); eq(c.rect.style.strokeColor, BP.ink, 'shape outline'); eq(c.rect.style.strokeWidth, 1.5, 'shape outline width');
  eq(c.rect.style.fontFamily, 'Architects Daughter', 'shape font'); eq(c.rect.style.fontSize, 22, 'shape label size'); eq(c.rect.style.fontStyle, 1, 'shape label bold');
  eq(c.rect.style.arcSize, 6, 'radius 3 px (absolute arcSize 6)'); eq(c.rect.style.absoluteArcSize, 1, 'absolute radius');
  if (!E.shadowOf(c.rect.style) || E.shadowOf(c.rect.style).dx !== 2 || E.shadowOf(c.rect.style).dy !== 3) F('shape shadow 2 right 3 down');
  if (c.term.style.absoluteArcSize) F('terminator pill lost its rounding');
  eq(c.cont.style.fillColor, 'none', 'container fill'); eq(c.cont.style.strokeColor, BP.inkSoft, 'container outline'); eq(c.cont.style.dashed, 1, 'container dashed');
  eq(c.cont.style.fontSize, 17, 'container label size'); if (E.shadowOf(c.cont.style)) F('container has a shadow');
  eq(c.e.style.strokeColor, BP.ink, 'line colour'); eq(c.e.style.strokeWidth, 2.5, 'line width'); eq(c.e.style.endArrow, 'block', 'filled triangle head');
  eq(c.er.style.endArrow, 'ERmany', 'crow\'s foot end kept'); eq(c.er.style.startArrow, 'ERmandOne', 'crow\'s foot start kept');
  eq(c.lbl.style.fontColor, BP.inkSoft, 'line label colour'); eq(c.lbl.style.labelBackgroundColor, 'none', 'line label background');
  if (!(c.lbl.lo && Math.abs(c.lbl.lo.y) >= 8)) F('line label not moved off the line: ' + JSON.stringify(c.lbl.lo));
  eq(c.txt.style.fontColor, BP.ink, 'text colour'); if (+c.txt.style.fontSize < 17) F('text below 17 px');
  eq(c.ic.style.fillColor, BP.ink, 'icon colour'); if (c.ic.style.deW) F('icon not regular weight');
  eq(c.hv.style.strokeColor, BP.ink, 'Harvey ball outline'); eq(c.hv.style.fillColor, '#ffffff', 'Harvey ball ring');
  E.runCommand('undo');
  if (JSON.stringify(S.doc) !== pre) F('undo does not restore exactly');

  // 2. Round trip: Outline > Blueprint > Outline > Blueprint matches the first Blueprint
  c = build();
  E.setDiagramStyle('blueprint', {});
  const norm = () => JSON.stringify(S.doc.pages[0].cells.map(x => [Object.keys(x.style).sort().map(k => k + '=' + x.style[k]), x.lo || null]));
  const first = norm();
  E.setDiagramStyle('outline', {});
  for (const x of S.doc.pages[0].cells) for (const k of ['deState', 'deDouble', 'deMarker', 'deLine', 'deShadow', 'deMode']) if (x.style[k] !== undefined) F('Outline kept ' + k);
  E.setDiagramStyle('blueprint', {});
  const second = norm();
  if (first !== second) F('round trip differs from the first Blueprint conversion');

  // 3. Every switch to and from Blueprint: right mode, readable, one Undo step that restores exactly
  const wcagOk = () => { const r = E.contrastRun(S.doc, { apply: false, manual: true }); return r.fixes.concat(r.problems.filter(p => p.what !== 'fill')).map(f => f.element + ' ' + f.what + ' ' + f.old + ' on ' + f.bg); };
  for (const m of ['outline', 'filled', 'duotone', 'sketch', 'neon']) for (const [from, to] of [[m, 'blueprint'], ['blueprint', m]]) {
    c = build();
    if (from !== 'outline') E.setDiagramStyle(from, {});
    const p0 = JSON.stringify(S.doc), u0 = S.undo.length;
    E.setDiagramStyle(to, {});
    if (S.doc.mode !== to) F(from + '>' + to + ': mode ' + S.doc.mode);
    const bad = wcagOk(); if (bad.length) F(from + '>' + to + ': not readable: ' + bad.slice(0, 3).join('; '));
    if (S.undo.length !== u0 + 1) F(from + '>' + to + ': not one undo step');
    E.runCommand('undo'); if (JSON.stringify(S.doc) !== p0) F(from + '>' + to + ': undo differs');
    if (to !== 'blueprint') E.setDiagramStyle(to, {}); // switch again and check what is left
    if (to !== 'blueprint' && S.doc.pages[0].cells.some(x => x.style.deState || x.style.deLine || x.style.deDouble || (x.style.deShadow && E.shadowOf(x.style).color.toLowerCase() === BP.shadow.color.toLowerCase()))) F(from + '>' + to + ': Blueprint keys left behind');
    if (to !== 'blueprint' && S.doc.pages[0].cells.some(x => x.style.deHarvey !== undefined && String(x.style.fillColor).toLowerCase() === String(x.style.strokeColor).toLowerCase())) F(from + '>' + to + ': Harvey wedge invisible');
  }

  // 4. States: colours, outline, icon, None
  c = build(); E.setDiagramStyle('blueprint', {});
  const o = E.styleOpts('blueprint');
  for (const id of Object.keys(E.BP_STATES)) {
    const s = E.BP_STATES[id];
    E.bpApplyState(c.rect, id, o);
    eq(c.rect.style.fillColor, s.fill, id + ' fill'); eq(c.rect.style.strokeColor, s.line || s.ink, id + ' outline'); eq(c.rect.style.fontColor, s.ink, id + ' text');
    eq(c.rect.style.deIcon, s.icon, id + ' icon');
    eq(c.rect.style.strokeWidth, s.width || 1.5, id + ' outline width');
    if (!!s.double !== (c.rect.style.deDouble === '1')) F(id + ' double outline');
    if (!!s.dashed !== (c.rect.style.dashed === '1')) F(id + ' dashed');
    if (s.noShadow && E.shadowOf(c.rect.style)) F(id + ' should have no shadow');
  }
  E.bpApplyState(c.rect, 'focus', o); eq(c.rect.style.fontColor, BP.redline, 'focus text'); eq(c.rect.style.fillColor, BP.fillRed, 'focus fill'); eq(c.rect.style.strokeColor, BP.ink, 'focus outline'); if (c.rect.style.deIcon) F('focus has an icon');
  E.bpApplyState(c.rect, 'external', o); eq(c.rect.style.fillColor, '#ffffff', 'external fill'); eq(c.rect.style.dashed, 1, 'external dashed');
  E.bpApplyState(c.rect, '', o); eq(c.rect.style.fillColor, BP.fill, 'None restores fill'); if (c.rect.style.deState || c.rect.style.deIcon || c.rect.style.dashed) F('None left state keys');
  // contrast: every state ink on its fill is at least 4.5:1, and no state colour is recoloured
  for (const id of Object.keys(E.BP_STATES)) { const s = E.BP_STATES[id]; if (E.wcagRatio(s.ink, s.fill) < 4.5) F(id + ' ink on fill below 4.5:1'); }
  E.bpApplyState(c.rect, 'comment', o); c.rect.style.deMode = 'blueprint';
  if (E.contrastRun(S.doc, { apply: false, manual: true }).fixes.some(f => f.id === c.rect.id)) F('contrast would recolour a Blueprint state');

  // 5. Line types render at the guide's pixel lengths
  const px = { existing: null, planned: '8 6', async: '1 6', retire: '8 6', annotation: '6 6', association: null };
  for (const l of E.BP_LINES) {
    E.bpSetLine(c.e, l.id);
    E.clearCache(); E.renderAll();
    const path = document.querySelector('#view [data-id="' + c.e.id + '"] path:not(.hit)');
    const da = path ? path.getAttribute('stroke-dasharray') : 'missing';
    const got = da ? da.split(/\s+/).map(v => Math.round(+v * 100) / 100).join(' ') : null;
    if ((got || null) !== px[l.id]) F('line ' + l.id + ': dashes ' + got + ', expected ' + px[l.id]);
    eq(c.e.style.strokeColor, l.stroke, 'line ' + l.id + ' colour');
    eq(c.e.style.endArrow, l.head, 'line ' + l.id + ' head');
  }

  // 6. Exports: dots, crisp offset shadows, double outline, markers, icons; no blur
  S.dirty = false; E.runCommand('testDiagram'); await new Promise(res => setTimeout(res, 1000));
  S.pi = S.doc.pages.findIndex(p => p.name === 'Test (Blueprint)');
  if (S.pi < 0) F('no Test (Blueprint) page');
  else {
    const ex = E.buildExportSvg(E.page()).svg;
    for (const [k, re] of [['dot matrix', /<pattern[^>]*width="20"/], ['offset shadow', /class="deShadow"[^>]*transform="translate\(2,3\)"|transform="translate\(2,3\)"[^>]*class="deShadow"/], ['double outline', /class="deDouble"/], ['marker', /class="deMarker"/], ['icon before label', /class="deIcon"/]]) if (!re.test(ex)) F('SVG export has no ' + k);
    if (/feGaussianBlur/.test(ex)) F('Blueprint export uses a blur');
    if (/<foreignObject/.test(ex)) F('SVG export has foreignObject');
    out.svgLen = ex.length;
  }

  // 7. draw.io round trip: Harvey balls saved as stencils, editor keys kept
  const xml = E.serializeDoc(S.doc);
  if (!/deHarvey=50;[^"]*shape=stencil\(/.test(xml)) F('Harvey ball not saved as a stencil');
  const back = await E.parseDrawio(xml);
  const bp = back.pages.find(p => p.name === 'Test (Blueprint)');
  const before = S.doc.pages.find(p => p.name === 'Test (Blueprint)');
  if (!bp) F('Blueprint page lost on reopen');
  else {
    const strip = (cs) => JSON.stringify(cs.map(x => { const s = Object.assign({}, x.style); delete s.shape; return [x.id, s, x.value]; }));
    if (strip(bp.cells) !== strip(before.cells)) F('reopened Blueprint page differs');
    if (back.mode !== 'outline' && bp.cells.filter(x => x.style.deMode === 'blueprint').length < 10) F('Blueprint cells not recognised');
  }

  // 8. Dot matrix: 20 px dots whatever the size
  const dots = before.cells.find(x => x.style.deDots !== undefined);
  dots.w = 2000; dots.h = 300; E.clearCache(); E.renderAll();
  const pat = document.querySelector('#view [data-id="' + dots.id + '"] pattern');
  if (!pat || pat.getAttribute('width') !== '20' || pat.getAttribute('height') !== '20') F('dot spacing changes with size');

  // 9. Hostile values are ignored safely
  const h = E.makeVertex('rect', 0, 0, 'outline');
  Object.assign(h.style, { deShadow: '1', deShadowColor: 'red;background:url(http://x)', deShadowDx: '1e9', deShadowDy: 'NaN', deShadowOpacity: '-5', deIcon: '../../x', deMarker: 'constructor', deState: '__proto__', deDouble: '1', deDots: '1', deDotsColor: 'url(#x)' });
  const hv = E.makeVertex('harvey0', 0, 0, 'outline'); hv.style.deHarvey = 'Infinity';
  const pg2 = E.newDoc().pages[0]; pg2.cells.push(h, hv);
  const ex2 = E.buildExportSvg(pg2).svg;
  if (/http:\/\/x|url\(#x\)|background:/.test(ex2)) F('hostile style value reached the export');
  if (E.shadowOf(h.style).dx !== 50) F('shadow offset not limited');
  out.harveyInf = E.harveyStencil(hv.style).length > 0;
  return out;
});
for (const f of r.fails) fail(f);
if (!r.harveyInf) fail('Harvey stencil for a hostile value');

// 10. Checklist: clicking a box ticks it (one Undo step); Enter adds an item
await pg.evaluate(() => {
  const E = DiagramEditor, S = E.S;
  S.doc = E.newDoc(); S.pi = 0; S.undo = []; S.redo = []; S.sel = []; E.clearCache();
  const c = E.makeVertex('checklist', 200, 200, 'outline'); E.page().cells.push(c); E.refreshMap();
  S.zoom = 1; S.tx = 0; S.ty = 0; E.renderAll();
  window.__ck = c.id;
});
await sleep(200);
const pos = await pg.evaluate(() => {
  const E = DiagramEditor, c = E.cellById(window.__ck), b = E.labelBox(c);
  const p = E.toScreen({ x: b.x + 4, y: b.y + 8 }), r = document.querySelector('#svg').getBoundingClientRect();
  return { x: p.x + r.left, y: p.y + r.top };
});
await pg.mouse.click(pos.x, pos.y);
await sleep(150);
const ck = await pg.evaluate(() => { const E = DiagramEditor; return { v: E.cellById(window.__ck).value, undo: E.S.undo.length }; });
if (!ck.v.startsWith('☑')) fail('clicking the first box did not tick it: ' + ck.v);
if (ck.undo !== 1) fail('ticking is not one undo step');
await pg.evaluate(() => { const E = DiagramEditor; E.startEdit(E.cellById(window.__ck)); const ed = E.S.editing.ed; const rg = document.createRange(); rg.selectNodeContents(ed); rg.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(rg); });
await pg.keyboard.press('Enter');
await pg.keyboard.type('Fourth item');
await pg.evaluate(() => DiagramEditor.finishEdit());
const ck2 = await pg.evaluate(() => { const E = DiagramEditor, c = E.cellById(window.__ck); return { v: c.value, h: c.h }; });
if (!/☐(&nbsp;|\s| )Fourth item/.test(ck2.v)) fail('Enter did not add an unticked item: ' + ck2.v);
if (ck2.h <= 70) fail('checklist did not grow: ' + ck2.h);

if (errors.length) fail('page errors: ' + errors.join(' | '));
console.log(process.exitCode ? 'Blueprint checks FAILED' : 'Blueprint checks passed (SVG ' + r.svgLen + ' chars)');
await b.close();
