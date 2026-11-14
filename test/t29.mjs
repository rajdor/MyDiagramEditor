// Diagram styles (docs/STYLES.md): all 20 permutations, WCAG readability, Undo, and the specific agreed rules.
import { open } from './harness.mjs';
const { b, pg, errors } = await open();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const fail = (m) => { console.log('FAIL: ' + m); process.exitCode = 1; };
await sleep(900);

const r = await pg.evaluate(() => {
  const E = DiagramEditor, S = E.S, out = [];
  const build = () => {
    S.doc = E.newDoc(); S.pi = 0; S.undo = []; S.redo = []; S.sel = []; S.styleOpts = {}; E.clearCache();
    const cells = E.page().cells, add = (c) => { cells.push(c); return c; };
    const rect = add(E.makeVertex('rect', 40, 40, 'outline')); rect.value = 'Plain';
    const proc = add(E.makeVertex('process', 200, 40, 'outline'));
    const dec = add(E.makeVertex('decision', 360, 40, 'outline'));
    const sticky = add(E.makeVertex('sticky', 520, 40, 'outline'));
    const cont = add(E.makeVertex('container', 20, 160, 'outline'));
    const person = add(E.makeVertex('person', 320, 200, 'outline'));
    const txt = add(E.makeVertex('text', 420, 200, 'outline'));
    const ic = add(E.makeIconVertex('database', 520, 200, 'outline')); ic.style.fillColor = '#2563eb';
    const ic2 = add(E.makeIconVertex('user', 600, 200, 'outline'));
    const e = add(E.makeEdge('outline')); e.source = proc.id; e.target = dec.id;
    const lbl = E.makeEdgeLabel(e, 'yes', 0, { x: 0, y: 0 }); add(lbl);
    E.refreshMap && E.refreshMap();
    return { rect, proc, dec, sticky, cont, person, txt, ic, ic2, e, lbl };
  };
  // after every switch nothing may fail WCAG 2.2: text 4.5:1 (3:1 large), outlines, lines and icons 3:1
  const wcagOk = () => { const r = E.contrastRun(S.doc, { apply: false, manual: true }); return r.fixes.concat(r.problems.filter(p => p.what !== 'fill')).map(f => f.element + ' ' + f.what + ' ' + f.old + ' on ' + f.bg); };
  const modes = ['outline', 'filled', 'duotone', 'sketch', 'neon'];
  // 1. every permutation: style switch works, readable, one Undo step restores exactly
  for (const from of modes) for (const to of modes) {
    if (from === to) continue;
    build();
    if (from !== 'outline') E.setDiagramStyle(from, {});
    const pre = JSON.stringify(S.doc), undoN = S.undo.length;
    E.setDiagramStyle(to, {});
    const okMode = S.doc.mode === to, bad = wcagOk(), oneStep = S.undo.length === undoN + 1;
    E.runCommand('undo');
    out.push({ p: from + '>' + to, okMode, bad, oneStep, undone: JSON.stringify(S.doc) === pre });
  }
  // 2. specific rules
  const rules = {};
  let x = build(); E.setDiagramStyle('filled', {});
  rules.filledBlock = x.proc.style.fillColor === '#3b82f6';
  rules.filledGrey = x.rect.style.fillColor === '#e2e8f0';
  rules.filledContainerTint = E.contrast(x.cont.style.fillColor, '#ffffff') < 1.2;
  rules.filledIconWeight = x.ic.style.deW === 'fill';
  rules.filledText = E.contrast(x.proc.style.fontColor || '#1e293b', x.proc.style.fillColor) >= 4.5;
  x = build(); E.setDiagramStyle('filled', { override: false });
  rules.overrideNo = x.sticky.style.fillColor === '#fff2cc' && x.proc.style.fillColor === '#dbeafe' && x.rect.style.fillColor === '#e2e8f0';
  x = build(); E.setDiagramStyle('filled', { icon: 'auto' }); rules.iconAuto = x.ic.style.deW === 'duotone';
  x = build(); E.setDiagramStyle('duotone', { scheme: 'complementary' });
  const hue = (h) => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; let hh = mx === r ? (g - b) / d % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (hh * 60 + 360) % 360; };
  rules.duoComplementBlueToOrange = hue(x.proc.style.fillColor) > 15 && hue(x.proc.style.fillColor) < 50;
  rules.duoStrongOutline = hue(x.proc.style.strokeColor) > 200 && hue(x.proc.style.strokeColor) < 235;
  rules.duoIcon = x.ic.style.deW === 'duotone' && !!x.ic.style.deC2;
  x = build(); E.setDiagramStyle('duotone', { scheme: 'triadic', scope: 'diagram' });
  rules.duoDiagramOnePair = x.proc.style.fillColor === x.dec.style.fillColor;
  x = build(); E.setDiagramStyle('duotone', { scheme: 'analogous' }); const cw = x.proc.style.fillColor; E.runCommand('undo');
  E.setDiagramStyle('duotone', { scheme: 'analogous', ccw: true }); rules.duoRotate = cw !== E.page().cells.find(c => c.id === x.proc.id).style.fillColor;
  x = build(); E.setDiagramStyle('sketch', {});
  rules.sketchKeepsColours = x.proc.style.fillColor === '#dbeafe' && x.proc.style.sketch === '1' && x.proc.style.fillStyle === 'hachure' && x.proc.style.fontFamily === 'Architects Daughter';
  rules.sketchContainerSolid = !x.cont.style.fillStyle || x.cont.style.fillStyle === 'solid';
  x = build(); E.setDiagramStyle('sketch', { font: false, rough: 'rough', fillStyle: 'dots' });
  rules.sketchOptions = !x.proc.style.fontFamily && x.proc.style.jiggle === '2.6' && x.proc.style.fillStyle === 'dots';
  x = build(); E.setDiagramStyle('filled', {}); E.setDiagramStyle('sketch', {});
  rules.filledToSketchKeepsFill = x.proc.style.fillColor === '#3b82f6';
  x = build(); E.setDiagramStyle('sketch', {}); E.setDiagramStyle('outline', {});
  rules.sketchToOutline = !x.proc.style.sketch && !x.proc.style.fontFamily && x.proc.style.fillColor === '#dbeafe';
  x = build(); E.setDiagramStyle('neon', {});
  const bgN = E.page().modelAttrs.background;
  rules.neonDarkCanvas = bgN === '#0f172a';
  rules.neonGlow = x.proc.style.deGlow === '1' && x.e.style.deGlow === '1' && +x.proc.style.strokeWidth >= 2 && x.lbl.style.labelBackgroundColor === 'none';
  rules.neonGreyUsesDominant = x.rect.style.strokeColor !== '#22d3ee';
  E.setDiagramStyle('outline', {});
  rules.neonToOutline = !x.proc.style.deGlow && x.proc.style.strokeWidth === '1.5' && x.lbl.style.labelBackgroundColor === '#ffffff' && !(E.page().modelAttrs || {}).background;
  x = build(); E.setDiagramStyle('neon', {}); E.setDiagramStyle('sketch', {});
  rules.neonToSketchKeepsDark = (E.page().modelAttrs || {}).background === '#0f172a' && !x.proc.style.deGlow;
  x = build(); E.setDiagramStyle('neon', { darkCanvas: false });
  rules.neonLightSoftGlow = !(E.page().modelAttrs || {}).background && x.proc.style.deGlow === '2';
  x = build(); E.setDiagramStyle('filled', {}); E.setDiagramStyle('outline', {});
  rules.filledToOutline = x.proc.style.strokeColor === '#3b82f6' && E.contrast(x.proc.style.fontColor || '#1e293b', x.proc.style.fillColor) >= 4.5 && x.ic.style.deW === undefined;
  x = build(); E.setDiagramStyle('duotone', {}); const duoStroke = x.proc.style.strokeColor; E.setDiagramStyle('outline', {});
  rules.duoToOutlineKeepsStrongOutline = x.proc.style.strokeColor === duoStroke;
  x = build(); E.setDiagramStyle('sketch', { fillStyle: 'none' });
  rules.sketchFillNone = x.proc.style.fillColor === 'none' && x.cont.style.fillColor === 'none' && x.proc.style.sketch === '1';
  // canvas switching: Neon is re-tuned for the new canvas; lines and icons meet 3:1, text meets 4.5:1
  const neonOk = (bg) => [x.proc, x.e, x.ic, x.rect].every(c => E.contrast(c.e ? c.style.strokeColor : c.style.dePh ? c.style.fillColor : c.style.strokeColor, bg) >= 3) && E.contrast(x.proc.style.fontColor || '#1e293b', bg) >= 4.5;
  x = build(); E.setDiagramStyle('neon', {}); rules.neonDark3to1 = neonOk('#0f172a');
  E.switchCanvas('#ffffff'); x = { proc: E.page().cells.find(c => c.id === x.proc.id), e: E.page().cells.find(c => c.id === x.e.id), ic: E.page().cells.find(c => c.id === x.ic.id), rect: E.page().cells.find(c => c.id === x.rect.id) };
  rules.neonRetunedForLight = neonOk('#ffffff') && x.proc.style.deGlow === '2' && !(E.page().modelAttrs || {}).background;
  const lightA = x.proc.style.strokeColor;
  x = build(); E.setDiagramStyle('neon', { darkCanvas: false }); rules.neonSameEitherWay = x.proc.style.strokeColor === lightA;
  E.switchCanvas('#0f172a'); rules.canvasDarkAllPages = S.doc.pages.every(p => (p.modelAttrs || {}).background === '#0f172a');
  // new shapes take the current style
  x = build(); E.setDiagramStyle('filled', {}); const nv = E.makeVertex('process', 0, 0, S.doc.mode);
  rules.newShapeFollowsStyle = nv.style.deMode === 'filled' && nv.style.fillColor === '#3b82f6';
  // icons: stencil only on save, decodable by draw.io's rules
  x = build(); const xml = E.serializeDoc(S.doc);
  rules.iconStencilOnSave = /dePh=database/.test(xml) && /shape=stencil\(/.test(xml) && !x.ic.style.shape;
  return { out, rules };
});
for (const o of r.out) {
  if (!o.okMode) fail(o.p + ': mode not set');
  if (o.bad.length) fail(o.p + ': text fails WCAG: ' + o.bad.join(', '));
  if (!o.oneStep) fail(o.p + ': not a single undo step');
  if (!o.undone) fail(o.p + ': undo did not restore the diagram exactly');
}
for (const k in r.rules) if (!r.rules[k]) fail('rule ' + k);
// the warning dialog: Cancel changes nothing, the button names the action
await pg.evaluate(() => { const S = DiagramEditor.S; S.doc = DiagramEditor.newDoc(); S.pi = 0; DiagramEditor.clearCache(); DiagramEditor.page().cells.push(DiagramEditor.makeVertex('process', 0, 0, 'outline')); });
await pg.evaluate(() => DiagramEditor.setDiagramStyle('filled')); await sleep(300);
const dlg = await pg.evaluate(() => { const m = document.querySelector('.modal'); return m ? { title: m.querySelector('h3, .mt, .title') ? m.querySelector('h3, .mt, .title').textContent : m.textContent.slice(0, 40), text: m.textContent, btns: [...m.querySelectorAll('button')].map(b => b.textContent) } : null; });
if (!dlg || !/Switch to Filled\?/.test(dlg.text) || !/Undo \(Ctrl\+Z\) reverses this/.test(dlg.text) || !dlg.btns.includes('Switch to Filled') || !dlg.btns.includes('Cancel')) fail('warning dialog wrong: ' + JSON.stringify(dlg));
await pg.evaluate(() => [...document.querySelectorAll('.modal button')].find(b => b.textContent === 'Cancel').click()); await sleep(200);
if (await pg.evaluate(() => DiagramEditor.S.doc.mode) !== 'outline') fail('Cancel changed the style');
await pg.evaluate(() => DiagramEditor.setDiagramStyle('filled')); await sleep(300);
await pg.evaluate(() => [...document.querySelectorAll('.modal button')].find(b => b.textContent === 'Switch to Filled').click()); await sleep(300);
if (await pg.evaluate(() => DiagramEditor.S.doc.mode) !== 'filled') fail('Switch button did not apply the style');
console.log(r.out.length + ' permutations checked; rules: ' + Object.keys(r.rules).length);
console.log(errors.join('\n') || 'no errors');
console.log(process.exitCode ? 'styles test FAILED' : 'styles test passed');
await b.close();
